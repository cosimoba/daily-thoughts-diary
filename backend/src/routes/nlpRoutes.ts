import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient, TagCategory } from '@prisma/client';
import NLPService from '../services/nlpService';
import TagService from '../services/tagService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const nlpService = new NLPService(prisma);
const tagService = new TagService(prisma);

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Analyze text and extract insights
 * POST /api/nlp/analyze
 */
router.post(
  '/analyze',
  authenticateToken,
  [
    body('text').isString().notEmpty().withMessage('Text is required'),
    body('language').optional().isString().isIn(['en', 'it', 'es', 'fr', 'de']),
    body('generateSummary').optional().isBoolean(),
    body('useCache').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text, language, generateSummary, useCache } = req.body;
      
      const analysis = await nlpService.analyze(text, {
        language,
        generateSummary,
        useCache
      });
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze text'
      });
    }
  }
);

/**
 * Get tag suggestions for text
 * POST /api/nlp/suggest-tags
 */
router.post(
  '/suggest-tags',
  authenticateToken,
  [
    body('text').isString().notEmpty().withMessage('Text is required'),
    body('language').optional().isString(),
    body('maxTags').optional().isInt({ min: 1, max: 50 }),
    body('minConfidence').optional().isFloat({ min: 0, max: 1 }),
    body('categories').optional().isArray(),
    body('categories.*').optional().isIn(Object.values(TagCategory))
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text, language, maxTags, minConfidence, categories } = req.body;
      const userId = (req as any).user.id;
      
      // Get NLP suggestions
      const suggestedTags = await nlpService.suggestTags(text, {
        language,
        maxTags,
        minConfidence,
        categories
      });
      
      // Check which tags already exist for the user
      const tagNames = suggestedTags.map(t => t.name.toLowerCase());
      const existingTags = await prisma.tag.findMany({
        where: {
          userId,
          name: {
            in: tagNames
          }
        }
      });
      
      const existingTagMap = new Map(existingTags.map(t => [t.name, t]));
      
      // Combine with existing tag information
      const enrichedTags = suggestedTags.map(tag => ({
        ...tag,
        exists: existingTagMap.has(tag.name.toLowerCase()),
        tagId: existingTagMap.get(tag.name.toLowerCase())?.id
      }));
      
      res.json({
        success: true,
        data: enrichedTags
      });
    } catch (error) {
      console.error('Tag suggestion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to suggest tags'
      });
    }
  }
);

/**
 * Validate tags against text
 * POST /api/nlp/validate-tags
 */
router.post(
  '/validate-tags',
  authenticateToken,
  [
    body('text').isString().notEmpty(),
    body('tags').isArray().notEmpty(),
    body('tags.*').isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text, tags } = req.body;
      
      const validationScores = nlpService.validateTags(tags, text);
      
      const results = Array.from(validationScores.entries()).map(([tag, score]) => ({
        tag,
        score,
        valid: score >= 0.5
      }));
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate tags'
      });
    }
  }
);

/**
 * Extract entities from text
 * POST /api/nlp/extract-entities
 */
router.post(
  '/extract-entities',
  authenticateToken,
  [
    body('text').isString().notEmpty(),
    body('language').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text, language } = req.body;
      
      const analysis = await nlpService.analyze(text, {
        language,
        useCache: true
      });
      
      res.json({
        success: true,
        data: {
          entities: analysis.entities,
          language: analysis.language,
          languageConfidence: analysis.languageConfidence
        }
      });
    } catch (error) {
      console.error('Entity extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract entities'
      });
    }
  }
);

/**
 * Analyze sentiment
 * POST /api/nlp/sentiment
 */
router.post(
  '/sentiment',
  authenticateToken,
  [
    body('text').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      const analysis = await nlpService.analyze(text, {
        useCache: true
      });
      
      res.json({
        success: true,
        data: {
          sentiment: analysis.sentiment,
          emotions: analysis.emotions
        }
      });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze sentiment'
      });
    }
  }
);

/**
 * Get keywords from text
 * POST /api/nlp/keywords
 */
router.post(
  '/keywords',
  authenticateToken,
  [
    body('text').isString().notEmpty(),
    body('language').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text, language } = req.body;
      
      const analysis = await nlpService.analyze(text, {
        language,
        useCache: true
      });
      
      res.json({
        success: true,
        data: {
          keywords: analysis.keywords,
          topics: analysis.topics
        }
      });
    } catch (error) {
      console.error('Keyword extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract keywords'
      });
    }
  }
);

/**
 * Batch analyze multiple texts
 * POST /api/nlp/batch-analyze
 */
router.post(
  '/batch-analyze',
  authenticateToken,
  [
    body('texts').isArray({ min: 1, max: 10 }),
    body('texts.*.text').isString().notEmpty(),
    body('texts.*.id').optional().isString(),
    body('options.language').optional().isString(),
    body('options.generateSummary').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { texts, options = {} } = req.body;
      
      const results = await Promise.all(
        texts.map(async (item: any) => {
          try {
            const analysis = await nlpService.analyze(item.text, options);
            return {
              id: item.id,
              success: true,
              analysis
            };
          } catch (error) {
            return {
              id: item.id,
              success: false,
              error: 'Analysis failed'
            };
          }
        })
      );
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Batch analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform batch analysis'
      });
    }
  }
);

/**
 * Get analysis from cache
 * POST /api/nlp/cached-analysis
 */
router.post(
  '/cached-analysis',
  authenticateToken,
  [
    body('text').isString().notEmpty(),
    body('language').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { text, language } = req.body;
      
      const cached = await nlpService.getFromCache(text, language);
      
      if (cached) {
        res.json({
          success: true,
          cached: true,
          data: cached
        });
      } else {
        res.json({
          success: true,
          cached: false,
          data: null
        });
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cached analysis'
      });
    }
  }
);

/**
 * Clear analysis cache (admin only)
 * DELETE /api/nlp/cache
 */
router.delete(
  '/cache',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // In production, add admin check here
      await nlpService.cleanCache();
      
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }
);

/**
 * Auto-tag an entry
 * POST /api/nlp/auto-tag
 */
router.post(
  '/auto-tag',
  authenticateToken,
  [
    body('entryId').isString().notEmpty(),
    body('text').isString().notEmpty(),
    body('options.maxTags').optional().isInt({ min: 1, max: 30 }),
    body('options.minConfidence').optional().isFloat({ min: 0, max: 1 }),
    body('options.categories').optional().isArray()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { entryId, text, options = {} } = req.body;
      const userId = (req as any).user.id;
      
      // Verify entry ownership
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId
        }
      });
      
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: 'Entry not found'
        });
      }
      
      // Get tag suggestions
      const suggestedTags = await nlpService.suggestTags(text, {
        maxTags: options.maxTags || 10,
        minConfidence: options.minConfidence || 0.6,
        categories: options.categories
      });
      
      // Create tags and attach to entry
      const attachments = await tagService.attachTagsToEntry({
        entryId,
        userId,
        tags: suggestedTags.map(tag => ({
          name: tag.name,
          category: tag.category,
          confidence: tag.confidence,
          autoGenerated: true
        }))
      });
      
      // Get full tag details
      const tags = await tagService.getEntryTags(entryId);
      
      res.json({
        success: true,
        data: {
          tags,
          autoGenerated: attachments.length
        }
      });
    } catch (error) {
      console.error('Auto-tagging error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-tag entry'
      });
    }
  }
);

export default router;