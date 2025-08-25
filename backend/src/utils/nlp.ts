import nlp from 'compromise';

export interface ExtractedTags {
  topics: string[];
  people: string[];
  places: string[];
  emotions: string[];
  activities: string[];
}

export function extractTags(text: string): ExtractedTags {
  const doc = nlp(text);
  
  // Extract different types of entities
  const topics = doc.topics().out('array').slice(0, 5);
  const people = doc.people().out('array').slice(0, 5);
  const places = doc.places().out('array').slice(0, 5);
  
  // Extract verbs for activities
  const activities = doc.verbs()
    .out('array')
    .filter((verb: string) => verb.length > 3)
    .slice(0, 5);
  
  // Extract emotions based on keywords
  const emotionKeywords = [
    'happy', 'sad', 'excited', 'anxious', 'grateful', 'angry',
    'frustrated', 'peaceful', 'confident', 'worried', 'joy',
    'love', 'fear', 'surprise', 'disgust', 'trust'
  ];
  
  const textLower = text.toLowerCase();
  const emotions = emotionKeywords.filter(emotion => 
    textLower.includes(emotion)
  );

  return {
    topics: [...new Set(topics)],
    people: [...new Set(people)],
    places: [...new Set(places)],
    emotions: [...new Set(emotions)],
    activities: [...new Set(activities)],
  };
}

export function suggestTags(text: string): string[] {
  const extracted = extractTags(text);
  
  // Combine all extracted tags and return top suggestions
  const allTags = [
    ...extracted.topics,
    ...extracted.people,
    ...extracted.places,
    ...extracted.emotions,
    ...extracted.activities,
  ];
  
  // Remove duplicates and filter out short tags
  return [...new Set(allTags)]
    .filter(tag => tag.length > 2)
    .slice(0, 10);
}

export function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const doc = nlp(text);
  
  const positiveWords = [
    'happy', 'good', 'great', 'excellent', 'amazing', 'wonderful',
    'fantastic', 'love', 'joy', 'excited', 'grateful', 'blessed',
    'beautiful', 'awesome', 'perfect', 'success', 'win'
  ];
  
  const negativeWords = [
    'sad', 'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry',
    'frustrated', 'disappointed', 'failed', 'lost', 'worry', 'anxious',
    'fear', 'stressed', 'depressed', 'lonely', 'hurt'
  ];
  
  const textLower = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveWords.forEach(word => {
    if (textLower.includes(word)) positiveScore++;
  });
  
  negativeWords.forEach(word => {
    if (textLower.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

export function getReadingTime(text: string): number {
  // Average reading speed is 200-250 words per minute
  const wordsPerMinute = 225;
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
}