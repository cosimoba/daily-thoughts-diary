import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient, TagCategory } from '@prisma/client';
import TagService from '../services/tagService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
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
 * Get all user tags
 * GET /api/tags
 */
router.get(
  '/',
  authenticateToken,
  [
    query('category').optional().isIn(Object.values(TagCategory)),
    query('sortBy').optional().isIn(['name', 'usage', 'created', 'lastUsed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { category, sortBy, limit, offset } = req.query;
      
      const tags = await tagService.getUserTags(userId, {
        category: category as TagCategory,
        sortBy: sortBy as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Get tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tags'
      });
    }
  }
);

/**
 * Create a new tag
 * POST /api/tags
 */
router.post(
  '/',
  authenticateToken,
  [
    body('name').isString().notEmpty().trim(),
    body('category').optional().isIn(Object.values(TagCategory)),
    body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/)
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { name, category, color } = req.body;
      
      const tag = await tagService.createTag({
        name,
        userId,
        category,
        color
      });
      
      res.status(201).json({
        success: true,
        data: tag
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: 'Tag already exists'
        });
      } else {
        console.error('Create tag error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create tag'
        });
      }
    }
  }
);

/**
 * Create multiple tags
 * POST /api/tags/batch
 */
router.post(
  '/batch',
  authenticateToken,
  [
    body('tags').isArray({ min: 1, max: 50 }),
    body('tags.*.name').isString().notEmpty().trim(),
    body('tags.*.category').optional().isIn(Object.values(TagCategory)),
    body('tags.*.color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/)
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { tags } = req.body;
      
      const createdTags = await tagService.createTags(
        tags.map((tag: any) => ({
          ...tag,
          userId
        }))
      );
      
      res.status(201).json({
        success: true,
        data: createdTags
      });
    } catch (error) {
      console.error('Batch create tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create tags'
      });
    }
  }
);

/**
 * Update a tag
 * PUT /api/tags/:tagId
 */
router.put(
  '/:tagId',
  authenticateToken,
  [
    param('tagId').isUUID(),
    body('name').optional().isString().notEmpty().trim(),
    body('category').optional().isIn(Object.values(TagCategory)),
    body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/)
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { tagId } = req.params;
      const { name, category, color } = req.body;
      
      const updatedTag = await tagService.updateTag(tagId, userId, {
        name,
        category,
        color
      });
      
      res.json({
        success: true,
        data: updatedTag
      });
    } catch (error: any) {
      if (error.message === 'Tag not found or access denied') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Update tag error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update tag'
        });
      }
    }
  }
);

/**
 * Delete a tag
 * DELETE /api/tags/:tagId
 */
router.delete(
  '/:tagId',
  authenticateToken,
  [
    param('tagId').isUUID()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { tagId } = req.params;
      
      await tagService.deleteTag(tagId, userId);
      
      res.json({
        success: true,
        message: 'Tag deleted successfully'
      });
    } catch (error: any) {
      if (error.message === 'Tag not found or access denied') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Delete tag error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete tag'
        });
      }
    }
  }
);

/**
 * Search tags
 * GET /api/tags/search
 */
router.get(
  '/search',
  authenticateToken,
  [
    query('q').isString().notEmpty(),
    query('category').optional().isIn(Object.values(TagCategory)),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { q, category, limit } = req.query;
      
      const tags = await tagService.searchTags(userId, q as string, {
        category: category as TagCategory,
        limit: limit ? parseInt(limit as string) : undefined
      });
      
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Search tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search tags'
      });
    }
  }
);

/**
 * Get tag suggestions
 * GET /api/tags/suggestions
 */
router.get(
  '/suggestions',
  authenticateToken,
  [
    query('text').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 20 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { text, limit } = req.query;
      
      const suggestions = await tagService.getTagSuggestions(
        userId,
        text as string,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggestions'
      });
    }
  }
);

/**
 * Get popular tags
 * GET /api/tags/popular
 */
router.get(
  '/popular',
  authenticateToken,
  [
    query('category').optional().isIn(Object.values(TagCategory)),
    query('days').optional().isInt({ min: 1, max: 365 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { category, days, limit } = req.query;
      
      const popularTags = await tagService.getPopularTags(userId, {
        category: category as TagCategory,
        days: days ? parseInt(days as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      
      res.json({
        success: true,
        data: popularTags
      });
    } catch (error) {
      console.error('Get popular tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular tags'
      });
    }
  }
);

/**
 * Merge tags
 * POST /api/tags/merge
 */
router.post(
  '/merge',
  authenticateToken,
  [
    body('sourceTagIds').isArray({ min: 1 }),
    body('sourceTagIds.*').isUUID(),
    body('targetTagId').isUUID()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { sourceTagIds, targetTagId } = req.body;
      
      const mergedTag = await tagService.mergeTags(
        sourceTagIds,
        targetTagId,
        userId
      );
      
      res.json({
        success: true,
        data: mergedTag
      });
    } catch (error: any) {
      if (error.message === 'Some tags not found or access denied') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Merge tags error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to merge tags'
        });
      }
    }
  }
);

/**
 * Attach tags to entry
 * POST /api/tags/attach
 */
router.post(
  '/attach',
  authenticateToken,
  [
    body('entryId').isUUID(),
    body('tags').isArray({ min: 1 }),
    body('tags.*.tagId').optional().isUUID(),
    body('tags.*.name').optional().isString().notEmpty(),
    body('tags.*.category').optional().isIn(Object.values(TagCategory)),
    body('tags.*.confidence').optional().isFloat({ min: 0, max: 1 }),
    body('tags.*.autoGenerated').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { entryId, tags } = req.body;
      
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
      
      const attachedTags = await tagService.attachTagsToEntry({
        entryId,
        tags,
        userId
      });
      
      res.json({
        success: true,
        data: attachedTags
      });
    } catch (error) {
      console.error('Attach tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to attach tags'
      });
    }
  }
);

/**
 * Remove tags from entry
 * DELETE /api/tags/detach
 */
router.delete(
  '/detach',
  authenticateToken,
  [
    body('entryId').isUUID(),
    body('tagIds').isArray({ min: 1 }),
    body('tagIds.*').isUUID()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { entryId, tagIds } = req.body;
      
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
      
      await tagService.removeTagsFromEntry(entryId, tagIds);
      
      res.json({
        success: true,
        message: 'Tags removed successfully'
      });
    } catch (error) {
      console.error('Detach tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove tags'
      });
    }
  }
);

/**
 * Get tags for an entry
 * GET /api/tags/entry/:entryId
 */
router.get(
  '/entry/:entryId',
  authenticateToken,
  [
    param('entryId').isUUID()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { entryId } = req.params;
      
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
      
      const tags = await tagService.getEntryTags(entryId);
      
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Get entry tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get entry tags'
      });
    }
  }
);

/**
 * Clean up unused tags
 * DELETE /api/tags/cleanup
 */
router.delete(
  '/cleanup',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      const deletedCount = await tagService.cleanupUnusedTags(userId);
      
      res.json({
        success: true,
        data: {
          deletedCount
        }
      });
    } catch (error) {
      console.error('Cleanup tags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup tags'
      });
    }
  }
);

export default router;