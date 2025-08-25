# NLP System Documentation

## Overview

The Daily Thoughts Diary NLP system provides intelligent text analysis and automatic tag generation capabilities. It uses compromise.js as the core NLP engine, enhanced with sentiment analysis, language detection, and custom entity extraction.

## Features

### 1. Text Analysis
- **Language Detection**: Automatic detection of text language (supports English, Italian, Spanish, French, German, and more)
- **Sentiment Analysis**: Determines positive, negative, or neutral sentiment with confidence scores
- **Entity Extraction**: Identifies people, places, organizations, dates, numbers, and events
- **Keyword Extraction**: Extracts meaningful keywords from text
- **Topic Detection**: Identifies main topics and themes
- **Emotion Analysis**: Detects emotional states (happy, sad, excited, anxious, etc.)

### 2. Tag Generation
- **Automatic Tagging**: Generates relevant tags based on content analysis
- **Tag Categories**: Classifies tags into 8 categories:
  - EMOTION: Emotional states and feelings
  - PERSON: Names of people mentioned
  - PLACE: Locations and places
  - TOPIC: Main themes and subjects
  - KEYWORD: Important terms and concepts
  - ACTIVITY: Actions and activities
  - EVENT: Events and occasions
  - ORGANIZATION: Companies, institutions, groups

### 3. Performance Optimization
- **In-Memory Caching**: Fast retrieval using NodeCache (1-hour TTL)
- **Database Caching**: Persistent cache for 24 hours
- **Batch Processing**: Analyze multiple texts in parallel
- **Confidence Scoring**: Each tag has a confidence score (0-1)

## API Endpoints

### NLP Analysis Endpoints

#### 1. Analyze Text
```http
POST /api/nlp/analyze
Authorization: Bearer {token}

{
  "text": "Your text to analyze",
  "language": "en", // optional
  "generateSummary": false, // optional
  "useCache": true // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "language": "en",
    "languageConfidence": 0.95,
    "sentiment": {
      "score": 5,
      "comparative": 0.25,
      "label": "positive",
      "confidence": 0.8
    },
    "entities": {
      "people": ["John"],
      "places": ["New York"],
      "organizations": ["Microsoft"],
      "dates": ["December 25th"],
      "numbers": ["150"],
      "events": ["conference"]
    },
    "keywords": ["machine", "learning", "technology"],
    "topics": ["artificial intelligence", "data science"],
    "emotions": {
      "primary": "HAPPY",
      "secondary": ["EXCITED", "GRATEFUL"],
      "scores": {
        "HAPPY": 3,
        "EXCITED": 2
      }
    },
    "tags": [
      {
        "name": "happy",
        "category": "EMOTION",
        "confidence": 0.95
      }
    ],
    "wordCount": 150,
    "sentenceCount": 8,
    "readingTime": 1
  }
}
```

#### 2. Suggest Tags
```http
POST /api/nlp/suggest-tags
Authorization: Bearer {token}

{
  "text": "Your text",
  "maxTags": 10,
  "minConfidence": 0.6,
  "categories": ["EMOTION", "PERSON", "PLACE"]
}
```

#### 3. Validate Tags
```http
POST /api/nlp/validate-tags
Authorization: Bearer {token}

{
  "text": "Your text",
  "tags": ["tag1", "tag2", "tag3"]
}
```

#### 4. Extract Entities
```http
POST /api/nlp/extract-entities
Authorization: Bearer {token}

{
  "text": "Your text",
  "language": "en"
}
```

#### 5. Sentiment Analysis
```http
POST /api/nlp/sentiment
Authorization: Bearer {token}

{
  "text": "Your text"
}
```

#### 6. Extract Keywords
```http
POST /api/nlp/keywords
Authorization: Bearer {token}

{
  "text": "Your text",
  "language": "en"
}
```

#### 7. Batch Analysis
```http
POST /api/nlp/batch-analyze
Authorization: Bearer {token}

{
  "texts": [
    { "id": "1", "text": "First text" },
    { "id": "2", "text": "Second text" }
  ],
  "options": {
    "language": "en",
    "generateSummary": false
  }
}
```

#### 8. Auto-Tag Entry
```http
POST /api/nlp/auto-tag
Authorization: Bearer {token}

{
  "entryId": "entry-uuid",
  "text": "Entry content",
  "options": {
    "maxTags": 10,
    "minConfidence": 0.6,
    "categories": ["EMOTION", "TOPIC"]
  }
}
```

### Tag Management Endpoints

#### 1. Get User Tags
```http
GET /api/tags?category=EMOTION&sortBy=usage&limit=20
Authorization: Bearer {token}
```

#### 2. Create Tag
```http
POST /api/tags
Authorization: Bearer {token}

{
  "name": "javascript",
  "category": "KEYWORD",
  "color": "#FFEAA7"
}
```

#### 3. Search Tags
```http
GET /api/tags/search?q=java&limit=10
Authorization: Bearer {token}
```

#### 4. Get Popular Tags
```http
GET /api/tags/popular?days=30&limit=10
Authorization: Bearer {token}
```

#### 5. Merge Tags
```http
POST /api/tags/merge
Authorization: Bearer {token}

{
  "sourceTagIds": ["tag1", "tag2"],
  "targetTagId": "tag3"
}
```

## Configuration

### Environment Variables
```env
# NLP Cache Settings
NLP_CACHE_TTL=3600 # seconds
NLP_DB_CACHE_TTL=86400 # seconds

# Analysis Limits
MAX_TAGS_PER_ANALYSIS=30
MAX_KEYWORDS_PER_ANALYSIS=20
MAX_TOPICS_PER_ANALYSIS=15

# Language Support
SUPPORTED_LANGUAGES=en,it,es,fr,de
DEFAULT_LANGUAGE=en
```

## Usage Examples

### JavaScript/TypeScript
```typescript
import { NLPService } from './services/nlpService';
import { TagService } from './services/tagService';

// Initialize services
const nlpService = new NLPService(prisma);
const tagService = new TagService(prisma);

// Analyze text
const analysis = await nlpService.analyze(
  'I had an amazing day at Central Park with my friends!',
  { language: 'en', generateSummary: false }
);

// Get tag suggestions
const tags = await nlpService.suggestTags(text, {
  maxTags: 10,
  minConfidence: 0.7,
  categories: ['EMOTION', 'PLACE', 'ACTIVITY']
});

// Attach tags to entry
await tagService.attachTagsToEntry({
  entryId: 'entry-id',
  userId: 'user-id',
  tags: tags.map(tag => ({
    name: tag.name,
    category: tag.category,
    confidence: tag.confidence,
    autoGenerated: true
  }))
});
```

## Performance Considerations

### Caching Strategy
1. **In-Memory Cache**: First level, fastest access (1-hour TTL)
2. **Database Cache**: Second level, persistent storage (24-hour TTL)
3. **Cache Key**: SHA256 hash of text + language

### Optimization Tips
1. **Batch Processing**: Use batch analysis for multiple texts
2. **Category Filtering**: Specify categories to reduce processing
3. **Confidence Threshold**: Set appropriate thresholds to filter noise
4. **Language Hint**: Provide language when known to skip detection

### Rate Limits
- Single analysis: 100 requests per minute
- Batch analysis: 10 requests per minute (max 10 texts per batch)
- Cache operations: Unlimited

## Language Support

### Fully Supported Languages
- **English (en)**: Full emotion keywords, sentiment analysis
- **Italian (it)**: Full emotion keywords, basic sentiment

### Partially Supported Languages
- Spanish (es), French (fr), German (de): Entity extraction, basic sentiment
- Other languages: Basic entity extraction only

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run NLP tests only
npm test nlpService

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Coverage
- Unit tests for NLPService and TagService
- Integration tests for all API endpoints
- Performance tests for batch operations
- Edge case handling (empty text, special characters, etc.)

## Error Handling

### Common Errors
1. **Invalid Language**: Falls back to English
2. **Empty Text**: Returns empty analysis
3. **Cache Miss**: Performs fresh analysis
4. **Rate Limit**: Returns 429 status
5. **Invalid Token**: Returns 401 status

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional additional information
}
```

## Best Practices

### For Developers
1. **Always use caching** for repeated analysis
2. **Batch similar requests** to improve performance
3. **Set appropriate confidence thresholds** based on use case
4. **Handle errors gracefully** in client applications
5. **Monitor cache hit rates** for optimization

### For Users
1. **Write clear, descriptive text** for better analysis
2. **Use proper names and places** for entity detection
3. **Express emotions clearly** for accurate emotion detection
4. **Review auto-generated tags** and adjust as needed

## Future Enhancements

### Planned Features
1. **Multi-language emotion detection** for all supported languages
2. **Custom entity training** for domain-specific terms
3. **Contextual tag suggestions** based on user history
4. **Advanced summarization** using extractive/abstractive methods
5. **Real-time analysis** with WebSocket support
6. **Tag recommendation ML model** based on user behavior

## Support

For issues or questions about the NLP system:
1. Check the API documentation
2. Review error messages and logs
3. Contact the development team
4. Submit issues on GitHub