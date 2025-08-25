import nlp from 'compromise';
import dates from 'compromise-dates';
import numbers from 'compromise-numbers';
import sentences from 'compromise-sentences';
import { franc } from 'franc';
import Sentiment from 'sentiment';
import { removeStopwords } from 'stopword';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import { PrismaClient, TagCategory } from '@prisma/client';

// Extend compromise with plugins
nlp.plugin(dates);
nlp.plugin(numbers);
nlp.plugin(sentences);

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Initialize cache with 1 hour TTL
const analysisCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Language-specific configurations
const LANGUAGE_CONFIG = {
  en: {
    emotionKeywords: {
      HAPPY: ['happy', 'joy', 'joyful', 'cheerful', 'delighted', 'pleased', 'glad', 'content', 'elated', 'thrilled'],
      SAD: ['sad', 'unhappy', 'depressed', 'melancholy', 'sorrowful', 'miserable', 'gloomy', 'dejected', 'down', 'blue'],
      EXCITED: ['excited', 'enthusiastic', 'eager', 'thrilled', 'pumped', 'energized', 'animated', 'exhilarated'],
      ANXIOUS: ['anxious', 'worried', 'nervous', 'uneasy', 'concerned', 'apprehensive', 'tense', 'stressed', 'restless'],
      CALM: ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'composed', 'placid', 'still', 'quiet'],
      ANGRY: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'outraged', 'livid', 'irate'],
      GRATEFUL: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'obliged'],
      CONFUSED: ['confused', 'puzzled', 'perplexed', 'bewildered', 'baffled', 'uncertain', 'lost'],
      HOPEFUL: ['hopeful', 'optimistic', 'positive', 'confident', 'expecting', 'anticipating'],
      TIRED: ['tired', 'exhausted', 'weary', 'fatigued', 'drained', 'worn out', 'sleepy', 'drowsy'],
      ENERGETIC: ['energetic', 'vibrant', 'dynamic', 'lively', 'vigorous', 'active', 'spirited'],
      NEUTRAL: ['neutral', 'indifferent', 'okay', 'fine', 'alright', 'normal', 'regular']
    }
  },
  it: {
    emotionKeywords: {
      HAPPY: ['felice', 'gioioso', 'allegro', 'contento', 'lieto', 'soddisfatto', 'beato'],
      SAD: ['triste', 'infelice', 'depresso', 'malinconico', 'addolorato', 'afflitto', 'mesto'],
      EXCITED: ['eccitato', 'entusiasta', 'emozionato', 'euforico', 'esaltato'],
      ANXIOUS: ['ansioso', 'preoccupato', 'nervoso', 'inquieto', 'agitato', 'teso'],
      CALM: ['calmo', 'tranquillo', 'sereno', 'pacifico', 'rilassato', 'placido'],
      ANGRY: ['arrabbiato', 'furioso', 'irritato', 'infuriato', 'adirato', 'rabbioso'],
      GRATEFUL: ['grato', 'riconoscente', 'fortunato', 'benedetto'],
      CONFUSED: ['confuso', 'perplesso', 'disorientato', 'sconcertato', 'smarrito'],
      HOPEFUL: ['speranzoso', 'ottimista', 'fiducioso', 'positivo'],
      TIRED: ['stanco', 'esausto', 'affaticato', 'spossato', 'sfinito'],
      ENERGETIC: ['energico', 'vivace', 'dinamico', 'vigoroso', 'attivo'],
      NEUTRAL: ['neutrale', 'indifferente', 'normale', 'regolare']
    }
  }
};

export interface TagWithConfidence {
  name: string;
  category: TagCategory;
  confidence: number;
  language?: string;
}

export interface NLPAnalysis {
  tags: TagWithConfidence[];
  sentiment: {
    score: number;
    comparative: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  keywords: string[];
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
    dates: string[];
    numbers: string[];
    events: string[];
  };
  language: string;
  languageConfidence: number;
  emotions: {
    primary: string;
    secondary: string[];
    scores: Record<string, number>;
  };
  topics: string[];
  readingTime: number;
  wordCount: number;
  sentenceCount: number;
  summary?: string;
}

export class NLPService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate hash for text to use as cache key
   */
  private generateTextHash(text: string, language?: string): string {
    const input = `${text}:${language || 'auto'}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Detect language of the text
   */
  private detectLanguage(text: string): { language: string; confidence: number } {
    const detectedLang = franc(text);
    
    // Map franc language codes to our supported languages
    const langMap: Record<string, string> = {
      'eng': 'en',
      'ita': 'it',
      'spa': 'es',
      'fra': 'fr',
      'deu': 'de',
      'por': 'pt',
      'rus': 'ru',
      'jpn': 'ja',
      'cmn': 'zh'
    };

    const language = langMap[detectedLang] || 'en';
    const confidence = detectedLang === 'und' ? 0.5 : 0.85;

    return { language, confidence };
  }

  /**
   * Analyze sentiment of the text
   */
  private analyzeSentiment(text: string): NLPAnalysis['sentiment'] {
    const result = sentiment.analyze(text);
    
    let label: 'positive' | 'negative' | 'neutral';
    let confidence: number;

    if (result.score > 2) {
      label = 'positive';
      confidence = Math.min(result.score / 10, 1);
    } else if (result.score < -2) {
      label = 'negative';
      confidence = Math.min(Math.abs(result.score) / 10, 1);
    } else {
      label = 'neutral';
      confidence = 1 - (Math.abs(result.score) / 10);
    }

    return {
      score: result.score,
      comparative: result.comparative,
      label,
      confidence
    };
  }

  /**
   * Extract entities from text using compromise
   */
  private extractEntities(text: string): NLPAnalysis['entities'] {
    const doc = nlp(text);

    // Extract various entity types
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations?.().out('array') || [];
    const dates = doc.dates().out('array');
    const numbers = doc.numbers().out('array');
    
    // Extract events (simplified - look for capitalized phrases with event keywords)
    const eventKeywords = ['conference', 'meeting', 'party', 'wedding', 'birthday', 'anniversary', 'festival', 'concert', 'event'];
    const events: string[] = [];
    const sentences = doc.sentences().out('array');
    
    sentences.forEach((sentence: string) => {
      const sentDoc = nlp(sentence);
      eventKeywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
          const nouns = sentDoc.nouns().out('array');
          nouns.forEach((noun: string) => {
            if (noun.toLowerCase().includes(keyword) || noun[0] === noun[0].toUpperCase()) {
              events.push(noun);
            }
          });
        }
      });
    });

    return {
      people: [...new Set(people)].slice(0, 10),
      places: [...new Set(places)].slice(0, 10),
      organizations: [...new Set(organizations)].slice(0, 10),
      dates: [...new Set(dates)].slice(0, 10),
      numbers: [...new Set(numbers)].slice(0, 10),
      events: [...new Set(events)].slice(0, 10)
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string, language: string): string[] {
    const doc = nlp(text);
    
    // Get nouns and adjectives as potential keywords
    const nouns = doc.nouns().out('array');
    const adjectives = doc.adjectives().out('array');
    
    // Combine and filter
    let keywords = [...nouns, ...adjectives];
    
    // Remove stopwords (basic implementation for English)
    if (language === 'en') {
      keywords = removeStopwords(keywords);
    }
    
    // Filter by length and frequency
    const keywordFreq = new Map<string, number>();
    keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      if (normalized.length > 2) {
        keywordFreq.set(normalized, (keywordFreq.get(normalized) || 0) + 1);
      }
    });
    
    // Sort by frequency and return top keywords
    return Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);
  }

  /**
   * Extract topics from text
   */
  private extractTopics(text: string): string[] {
    const doc = nlp(text);
    
    // Get topics using compromise
    const topics = doc.topics().out('array');
    
    // Also extract noun phrases as potential topics
    const nounPhrases = doc.match('#Determiner? #Adjective* #Noun+').out('array');
    
    // Combine and deduplicate
    const allTopics = [...new Set([...topics, ...nounPhrases])]
      .filter(topic => topic.length > 3 && topic.split(' ').length <= 3)
      .slice(0, 15);
    
    return allTopics;
  }

  /**
   * Analyze emotions in text
   */
  private analyzeEmotions(text: string, language: string): NLPAnalysis['emotions'] {
    const textLower = text.toLowerCase();
    const emotionScores: Record<string, number> = {};
    
    const config = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG] || LANGUAGE_CONFIG.en;
    
    // Calculate emotion scores based on keyword presence
    Object.entries(config.emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      if (score > 0) {
        emotionScores[emotion] = score;
      }
    });
    
    // Determine primary and secondary emotions
    const sortedEmotions = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1]);
    
    const primary = sortedEmotions[0]?.[0] || 'NEUTRAL';
    const secondary = sortedEmotions.slice(1, 4).map(([emotion]) => emotion);
    
    return {
      primary,
      secondary,
      scores: emotionScores
    };
  }

  /**
   * Generate tags from analysis
   */
  private generateTags(analysis: Partial<NLPAnalysis>): TagWithConfidence[] {
    const tags: TagWithConfidence[] = [];
    
    // Add entity-based tags
    if (analysis.entities) {
      analysis.entities.people.forEach(person => {
        tags.push({
          name: person,
          category: TagCategory.PERSON,
          confidence: 0.9,
          language: analysis.language
        });
      });
      
      analysis.entities.places.forEach(place => {
        tags.push({
          name: place,
          category: TagCategory.PLACE,
          confidence: 0.85,
          language: analysis.language
        });
      });
      
      analysis.entities.organizations.forEach(org => {
        tags.push({
          name: org,
          category: TagCategory.ORGANIZATION,
          confidence: 0.8,
          language: analysis.language
        });
      });
      
      analysis.entities.events.forEach(event => {
        tags.push({
          name: event,
          category: TagCategory.EVENT,
          confidence: 0.75,
          language: analysis.language
        });
      });
    }
    
    // Add emotion tags
    if (analysis.emotions) {
      tags.push({
        name: analysis.emotions.primary.toLowerCase(),
        category: TagCategory.EMOTION,
        confidence: 0.95,
        language: analysis.language
      });
      
      analysis.emotions.secondary.forEach(emotion => {
        tags.push({
          name: emotion.toLowerCase(),
          category: TagCategory.EMOTION,
          confidence: 0.7,
          language: analysis.language
        });
      });
    }
    
    // Add topic tags
    if (analysis.topics) {
      analysis.topics.slice(0, 5).forEach(topic => {
        tags.push({
          name: topic,
          category: TagCategory.TOPIC,
          confidence: 0.8,
          language: analysis.language
        });
      });
    }
    
    // Add keyword tags
    if (analysis.keywords) {
      analysis.keywords.slice(0, 10).forEach(keyword => {
        // Check if keyword is already added as another category
        const exists = tags.some(tag => 
          tag.name.toLowerCase() === keyword.toLowerCase()
        );
        
        if (!exists) {
          tags.push({
            name: keyword,
            category: TagCategory.KEYWORD,
            confidence: 0.6,
            language: analysis.language
          });
        }
      });
    }
    
    // Detect activities (verbs in certain contexts)
    const doc = nlp(analysis.sentiment ? '' : '');
    const verbs = doc.verbs().out('array');
    const activityVerbs = ['running', 'walking', 'reading', 'writing', 'coding', 'cooking', 
                          'traveling', 'working', 'studying', 'exercising', 'shopping'];
    
    verbs.forEach((verb: string) => {
      const normalized = verb.toLowerCase();
      if (activityVerbs.some(activity => normalized.includes(activity))) {
        tags.push({
          name: normalized,
          category: TagCategory.ACTIVITY,
          confidence: 0.7,
          language: analysis.language
        });
      }
    });
    
    // Deduplicate and sort by confidence
    const uniqueTags = new Map<string, TagWithConfidence>();
    tags.forEach(tag => {
      const key = `${tag.name.toLowerCase()}_${tag.category}`;
      const existing = uniqueTags.get(key);
      if (!existing || existing.confidence < tag.confidence) {
        uniqueTags.set(key, tag);
      }
    });
    
    return Array.from(uniqueTags.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 30);
  }

  /**
   * Generate a summary of the text
   */
  private generateSummary(text: string): string {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    
    if (sentences.length <= 3) {
      return text;
    }
    
    // Simple extractive summarization - take first and most important sentences
    const importantSentences: string[] = [];
    
    // Always include the first sentence
    if (sentences[0]) {
      importantSentences.push(sentences[0]);
    }
    
    // Find sentences with the most entities/keywords
    const sentenceScores = sentences.map((sentence: string, index: number) => {
      const sentDoc = nlp(sentence);
      const score = 
        sentDoc.people().out('array').length * 3 +
        sentDoc.places().out('array').length * 2 +
        sentDoc.dates().out('array').length * 2 +
        sentDoc.nouns().out('array').length;
      
      return { sentence, score, index };
    });
    
    // Sort by score and take top sentences
    sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .forEach(item => {
        if (!importantSentences.includes(item.sentence)) {
          importantSentences.push(item.sentence);
        }
      });
    
    return importantSentences.join(' ').substring(0, 500);
  }

  /**
   * Main analysis function
   */
  async analyze(text: string, options?: {
    language?: string;
    generateSummary?: boolean;
    useCache?: boolean;
  }): Promise<NLPAnalysis> {
    const { 
      language: forcedLanguage, 
      generateSummary = false, 
      useCache = true 
    } = options || {};
    
    // Check cache first
    const cacheKey = this.generateTextHash(text, forcedLanguage);
    if (useCache) {
      const cached = analysisCache.get<NLPAnalysis>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Detect or use provided language
    const { language, confidence: languageConfidence } = forcedLanguage 
      ? { language: forcedLanguage, confidence: 1 }
      : this.detectLanguage(text);
    
    // Perform analysis
    const doc = nlp(text);
    
    const analysis: NLPAnalysis = {
      language,
      languageConfidence,
      sentiment: this.analyzeSentiment(text),
      entities: this.extractEntities(text),
      keywords: this.extractKeywords(text, language),
      topics: this.extractTopics(text),
      emotions: this.analyzeEmotions(text, language),
      wordCount: text.split(/\s+/).length,
      sentenceCount: doc.sentences().length,
      readingTime: Math.ceil(text.split(/\s+/).length / 225),
      tags: []
    };
    
    // Generate tags based on analysis
    analysis.tags = this.generateTags(analysis);
    
    // Generate summary if requested
    if (generateSummary) {
      analysis.summary = this.generateSummary(text);
    }
    
    // Cache the result
    if (useCache) {
      analysisCache.set(cacheKey, analysis);
      
      // Also persist to database for longer-term caching
      await this.prisma.nLPAnalysisCache.upsert({
        where: { textHash: cacheKey },
        update: {
          analysis: analysis as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        create: {
          textHash: cacheKey,
          language,
          analysis: analysis as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      }).catch(err => {
        console.error('Failed to cache analysis in database:', err);
      });
    }
    
    return analysis;
  }

  /**
   * Validate and score tags
   */
  validateTags(tags: string[], text: string): Map<string, number> {
    const textLower = text.toLowerCase();
    const validatedTags = new Map<string, number>();
    
    tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      let score = 0;
      
      // Check exact match
      if (textLower.includes(tagLower)) {
        score = 1;
      } else {
        // Check partial match
        const words = tagLower.split(/\s+/);
        const matchedWords = words.filter(word => textLower.includes(word));
        score = matchedWords.length / words.length;
      }
      
      validatedTags.set(tag, score);
    });
    
    return validatedTags;
  }

  /**
   * Suggest tags for a given text
   */
  async suggestTags(text: string, options?: {
    language?: string;
    maxTags?: number;
    minConfidence?: number;
    categories?: TagCategory[];
  }): Promise<TagWithConfidence[]> {
    const { 
      language, 
      maxTags = 10, 
      minConfidence = 0.5,
      categories 
    } = options || {};
    
    const analysis = await this.analyze(text, { language });
    
    let tags = analysis.tags;
    
    // Filter by categories if specified
    if (categories && categories.length > 0) {
      tags = tags.filter(tag => categories.includes(tag.category));
    }
    
    // Filter by confidence and limit
    return tags
      .filter(tag => tag.confidence >= minConfidence)
      .slice(0, maxTags);
  }

  /**
   * Clean expired cache entries
   */
  async cleanCache(): Promise<void> {
    // Clean in-memory cache (handled automatically by node-cache)
    
    // Clean database cache
    await this.prisma.nLPAnalysisCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  /**
   * Get analysis from cache
   */
  async getFromCache(text: string, language?: string): Promise<NLPAnalysis | null> {
    const cacheKey = this.generateTextHash(text, language);
    
    // Check in-memory cache first
    const memCached = analysisCache.get<NLPAnalysis>(cacheKey);
    if (memCached) {
      return memCached;
    }
    
    // Check database cache
    const dbCached = await this.prisma.nLPAnalysisCache.findUnique({
      where: { textHash: cacheKey }
    });
    
    if (dbCached && dbCached.expiresAt > new Date()) {
      const analysis = dbCached.analysis as unknown as NLPAnalysis;
      // Restore to memory cache
      analysisCache.set(cacheKey, analysis);
      return analysis;
    }
    
    return null;
  }
}

export default NLPService;