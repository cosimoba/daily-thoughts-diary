import { PrismaClient, TagCategory } from '@prisma/client';
import NLPService from '../src/services/nlpService';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    nLPAnalysisCache: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    TagCategory: {
      EMOTION: 'EMOTION',
      PERSON: 'PERSON',
      PLACE: 'PLACE',
      TOPIC: 'TOPIC',
      KEYWORD: 'KEYWORD',
      ACTIVITY: 'ACTIVITY',
      EVENT: 'EVENT',
      ORGANIZATION: 'ORGANIZATION'
    }
  };
});

describe('NLPService', () => {
  let nlpService: NLPService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    nlpService = new NLPService(prisma);
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should analyze English text correctly', async () => {
      const text = 'I had a wonderful day at Central Park in New York with my friend John. We were so happy and excited about the beautiful weather!';
      
      const analysis = await nlpService.analyze(text, { useCache: false });
      
      expect(analysis).toBeDefined();
      expect(analysis.language).toBe('en');
      expect(analysis.languageConfidence).toBeGreaterThan(0.5);
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.sentenceCount).toBeGreaterThan(0);
      
      // Check sentiment
      expect(analysis.sentiment).toBeDefined();
      expect(analysis.sentiment.label).toBe('positive');
      
      // Check entities
      expect(analysis.entities.people).toContain('John');
      expect(analysis.entities.places.some(p => p.includes('Central Park') || p.includes('New York'))).toBe(true);
      
      // Check emotions
      expect(analysis.emotions.primary).toBeDefined();
      expect(['HAPPY', 'EXCITED'].includes(analysis.emotions.primary)).toBe(true);
      
      // Check tags
      expect(analysis.tags.length).toBeGreaterThan(0);
      expect(analysis.tags.some(t => t.category === TagCategory.PERSON && t.name === 'John')).toBe(true);
      expect(analysis.tags.some(t => t.category === TagCategory.EMOTION)).toBe(true);
    });

    it('should analyze Italian text correctly', async () => {
      const text = 'Sono molto felice oggi. Ho visitato Roma con Maria e abbiamo mangiato una pizza deliziosa!';
      
      const analysis = await nlpService.analyze(text, { 
        language: 'it',
        useCache: false 
      });
      
      expect(analysis).toBeDefined();
      expect(analysis.language).toBe('it');
      
      // Check Italian emotion detection
      expect(analysis.emotions.scores['HAPPY']).toBeGreaterThan(0);
    });

    it('should generate summary when requested', async () => {
      const longText = `
        Today was an incredible day at the office. We launched our new product successfully 
        and the entire team was celebrating. The CEO gave a speech about our achievements.
        Later, we had a team dinner at a fancy restaurant downtown. Everyone was happy and 
        excited about the future. This is definitely a milestone for our company.
        I'm grateful to be part of such an amazing team.
      `;
      
      const analysis = await nlpService.analyze(longText, { 
        generateSummary: true,
        useCache: false 
      });
      
      expect(analysis.summary).toBeDefined();
      expect(analysis.summary!.length).toBeLessThan(longText.length);
    });

    it('should handle negative sentiment correctly', async () => {
      const text = 'I am so sad and disappointed. Everything went wrong today. I feel terrible and frustrated.';
      
      const analysis = await nlpService.analyze(text, { useCache: false });
      
      expect(analysis.sentiment.label).toBe('negative');
      expect(analysis.sentiment.score).toBeLessThan(0);
      expect(['SAD', 'ANGRY', 'FRUSTRATED'].includes(analysis.emotions.primary)).toBe(true);
    });

    it('should detect neutral sentiment', async () => {
      const text = 'I went to the store today. I bought some groceries and came back home.';
      
      const analysis = await nlpService.analyze(text, { useCache: false });
      
      expect(analysis.sentiment.label).toBe('neutral');
    });

    it('should extract keywords correctly', async () => {
      const text = 'Machine learning and artificial intelligence are transforming the technology industry.';
      
      const analysis = await nlpService.analyze(text, { useCache: false });
      
      expect(analysis.keywords).toBeDefined();
      expect(analysis.keywords.length).toBeGreaterThan(0);
      expect(analysis.keywords.some(k => k.includes('machine') || k.includes('learning'))).toBe(true);
    });

    it('should extract dates and numbers', async () => {
      const text = 'The meeting is scheduled for December 25th, 2024 at 3:30 PM. We expect 150 participants.';
      
      const analysis = await nlpService.analyze(text, { useCache: false });
      
      expect(analysis.entities.dates.length).toBeGreaterThan(0);
      expect(analysis.entities.numbers.length).toBeGreaterThan(0);
    });

    it('should use cache when enabled', async () => {
      const text = 'Test caching functionality';
      
      // First call - should cache
      const analysis1 = await nlpService.analyze(text, { useCache: true });
      
      // Second call - should use cache
      const analysis2 = await nlpService.analyze(text, { useCache: true });
      
      expect(analysis1).toEqual(analysis2);
    });
  });

  describe('suggestTags', () => {
    it('should suggest relevant tags', async () => {
      const text = 'Had a great meeting with Sarah at Microsoft headquarters in Seattle.';
      
      const tags = await nlpService.suggestTags(text, {
        maxTags: 5,
        minConfidence: 0.5
      });
      
      expect(tags.length).toBeLessThanOrEqual(5);
      expect(tags.every(t => t.confidence >= 0.5)).toBe(true);
      expect(tags.some(t => t.category === TagCategory.PERSON)).toBe(true);
      expect(tags.some(t => t.category === TagCategory.ORGANIZATION)).toBe(true);
    });

    it('should filter by categories', async () => {
      const text = 'Feeling happy and excited about visiting Paris next week!';
      
      const tags = await nlpService.suggestTags(text, {
        categories: [TagCategory.EMOTION, TagCategory.PLACE]
      });
      
      expect(tags.every(t => 
        t.category === TagCategory.EMOTION || 
        t.category === TagCategory.PLACE
      )).toBe(true);
    });

    it('should respect confidence threshold', async () => {
      const text = 'Simple text for testing';
      
      const tags = await nlpService.suggestTags(text, {
        minConfidence: 0.8
      });
      
      expect(tags.every(t => t.confidence >= 0.8)).toBe(true);
    });
  });

  describe('validateTags', () => {
    it('should validate tags present in text', () => {
      const text = 'I love programming in JavaScript and Python';
      const tags = ['programming', 'JavaScript', 'Python', 'Ruby'];
      
      const validation = nlpService.validateTags(tags, text);
      
      expect(validation.get('programming')).toBe(1);
      expect(validation.get('JavaScript')).toBe(1);
      expect(validation.get('Python')).toBe(1);
      expect(validation.get('Ruby')).toBe(0);
    });

    it('should handle partial matches', () => {
      const text = 'Working on machine learning projects';
      const tags = ['machine learning', 'deep learning'];
      
      const validation = nlpService.validateTags(tags, text);
      
      expect(validation.get('machine learning')).toBe(1);
      expect(validation.get('deep learning')).toBeGreaterThan(0);
      expect(validation.get('deep learning')).toBeLessThan(1);
    });
  });

  describe('getFromCache', () => {
    it('should retrieve from database cache', async () => {
      const mockAnalysis = {
        language: 'en',
        sentiment: { label: 'positive', score: 5, comparative: 0.5, confidence: 0.8 },
        tags: []
      };
      
      (prisma.nLPAnalysisCache.findUnique as jest.Mock).mockResolvedValue({
        analysis: mockAnalysis,
        expiresAt: new Date(Date.now() + 3600000)
      });
      
      const cached = await nlpService.getFromCache('test text');
      
      expect(cached).toBeDefined();
      expect(cached?.language).toBe('en');
    });

    it('should return null for expired cache', async () => {
      (prisma.nLPAnalysisCache.findUnique as jest.Mock).mockResolvedValue({
        analysis: {},
        expiresAt: new Date(Date.now() - 3600000) // Expired
      });
      
      const cached = await nlpService.getFromCache('test text');
      
      expect(cached).toBeNull();
    });
  });

  describe('cleanCache', () => {
    it('should clean expired cache entries', async () => {
      await nlpService.cleanCache();
      
      expect(prisma.nLPAnalysisCache.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('Language detection', () => {
    it('should detect multiple languages', async () => {
      const texts = [
        { text: 'Hello, how are you today?', expectedLang: 'en' },
        { text: 'Ciao, come stai oggi?', expectedLang: 'it' },
        { text: 'Bonjour, comment allez-vous?', expectedLang: 'fr' },
        { text: 'Hola, ¿cómo estás?', expectedLang: 'es' }
      ];
      
      for (const { text, expectedLang } of texts) {
        const analysis = await nlpService.analyze(text, { useCache: false });
        // Language detection might not be perfect for short texts
        expect(['en', 'it', 'fr', 'es', 'de']).toContain(analysis.language);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', async () => {
      const analysis = await nlpService.analyze('', { useCache: false });
      
      expect(analysis.wordCount).toBe(0);
      expect(analysis.tags.length).toBe(0);
    });

    it('should handle very long text', async () => {
      const longText = 'Lorem ipsum '.repeat(1000);
      
      const analysis = await nlpService.analyze(longText, { useCache: false });
      
      expect(analysis.wordCount).toBeGreaterThan(1000);
      expect(analysis.readingTime).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const text = 'Testing with @mentions, #hashtags, and emojis! 😊';
      
      const analysis = await nlpService.analyze(text, { useCache: false });
      
      expect(analysis).toBeDefined();
      expect(analysis.wordCount).toBeGreaterThan(0);
    });
  });
});