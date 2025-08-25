import request from 'supertest';
import express, { Application } from 'express';
import jwt from 'jsonwebtoken';
import nlpRoutes from '../src/routes/nlpRoutes';
import { PrismaClient } from '@prisma/client';

// Mock Prisma and services
jest.mock('@prisma/client');
jest.mock('../src/services/nlpService');
jest.mock('../src/services/tagService');

describe('NLP Routes', () => {
  let app: Application;
  let authToken: string;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/nlp', nlpRoutes);

    // Generate test JWT token
    authToken = jwt.sign(
      { userId: 'test-user-id', email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('POST /api/nlp/analyze', () => {
    it('should analyze text successfully', async () => {
      const response = await request(app)
        .post('/api/nlp/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'I had a wonderful day at the park with my friends.',
          language: 'en',
          generateSummary: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/nlp/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for missing auth token', async () => {
      const response = await request(app)
        .post('/api/nlp/analyze')
        .send({
          text: 'Test text'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/nlp/suggest-tags', () => {
    it('should suggest tags for text', async () => {
      const response = await request(app)
        .post('/api/nlp/suggest-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Meeting with John at Microsoft headquarters about AI project.',
          maxTags: 5,
          minConfidence: 0.6
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter by categories', async () => {
      const response = await request(app)
        .post('/api/nlp/suggest-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Feeling happy and excited!',
          categories: ['EMOTION']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/nlp/validate-tags', () => {
    it('should validate tags against text', async () => {
      const response = await request(app)
        .post('/api/nlp/validate-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Learning JavaScript and Python programming',
          tags: ['JavaScript', 'Python', 'Ruby']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/nlp/validate-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Test text'
          // Missing tags array
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/nlp/extract-entities', () => {
    it('should extract entities from text', async () => {
      const response = await request(app)
        .post('/api/nlp/extract-entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'John and Mary visited Paris and Rome last summer.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.entities).toBeDefined();
    });
  });

  describe('POST /api/nlp/sentiment', () => {
    it('should analyze sentiment', async () => {
      const response = await request(app)
        .post('/api/nlp/sentiment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'I am so happy and excited about this amazing opportunity!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sentiment).toBeDefined();
      expect(response.body.data.emotions).toBeDefined();
    });
  });

  describe('POST /api/nlp/keywords', () => {
    it('should extract keywords', async () => {
      const response = await request(app)
        .post('/api/nlp/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Machine learning and artificial intelligence are transforming technology.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.keywords).toBeDefined();
      expect(response.body.data.topics).toBeDefined();
    });
  });

  describe('POST /api/nlp/batch-analyze', () => {
    it('should analyze multiple texts', async () => {
      const response = await request(app)
        .post('/api/nlp/batch-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          texts: [
            { id: '1', text: 'First text to analyze' },
            { id: '2', text: 'Second text to analyze' }
          ],
          options: {
            language: 'en'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for too many texts', async () => {
      const texts = Array(11).fill({ text: 'Test' });
      
      const response = await request(app)
        .post('/api/nlp/batch-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ texts });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/nlp/cached-analysis', () => {
    it('should retrieve cached analysis', async () => {
      const response = await request(app)
        .post('/api/nlp/cached-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Test text for caching'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('cached');
    });
  });

  describe('DELETE /api/nlp/cache', () => {
    it('should clear cache', async () => {
      const response = await request(app)
        .delete('/api/nlp/cache')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/nlp/auto-tag', () => {
    it('should auto-tag an entry', async () => {
      // Mock entry existence check
      const mockPrisma = new PrismaClient();
      (mockPrisma.entry.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'entry-1',
        userId: 'test-user-id'
      });

      const response = await request(app)
        .post('/api/nlp/auto-tag')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryId: 'entry-1',
          text: 'Had a great meeting with the team about the new project.',
          options: {
            maxTags: 5,
            minConfidence: 0.7
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent entry', async () => {
      const mockPrisma = new PrismaClient();
      (mockPrisma.entry.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/nlp/auto-tag')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryId: 'non-existent',
          text: 'Test text'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Entry not found');
    });
  });
});