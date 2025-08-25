import { Router } from 'express';
import { body, query, param } from 'express-validator';
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  toggleFavorite,
  searchEntries,
  getEntryStats
} from '../controllers/entryController';
import { authenticate } from '../middleware/auth';
import { upload, uploadMultipleFiles } from '../controllers/uploadController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createEntryValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50000 characters'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('mood')
    .optional()
    .isIn(['HAPPY', 'SAD', 'EXCITED', 'ANXIOUS', 'CALM', 'ANGRY', 'GRATEFUL', 'CONFUSED', 'HOPEFUL', 'TIRED', 'ENERGETIC', 'NEUTRAL'])
    .withMessage('Invalid mood value'),
  body('privacy')
    .optional()
    .isIn(['PRIVATE', 'PUBLIC', 'FRIENDS'])
    .withMessage('Invalid privacy value'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const updateEntryValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid entry ID'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50000 characters'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('mood')
    .optional()
    .isIn(['HAPPY', 'SAD', 'EXCITED', 'ANXIOUS', 'CALM', 'ANGRY', 'GRATEFUL', 'CONFUSED', 'HOPEFUL', 'TIRED', 'ENERGETIC', 'NEUTRAL'])
    .withMessage('Invalid mood value'),
  body('privacy')
    .optional()
    .isIn(['PRIVATE', 'PUBLIC', 'FRIENDS'])
    .withMessage('Invalid privacy value'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('mood')
    .optional()
    .isIn(['HAPPY', 'SAD', 'EXCITED', 'ANXIOUS', 'CALM', 'ANGRY', 'GRATEFUL', 'CONFUSED', 'HOPEFUL', 'TIRED', 'ENERGETIC', 'NEUTRAL'])
    .withMessage('Invalid mood value'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order')
];

// Routes
router.get('/stats', getEntryStats);
router.get('/search', searchEntries);
router.get('/', queryValidation, getEntries);
router.get('/:id', param('id').isUUID(), getEntry);
router.post('/', createEntryValidation, createEntry);
router.post('/:id/attachments', param('id').isUUID(), upload.array('files', 5), uploadMultipleFiles);
router.put('/:id', updateEntryValidation, updateEntry);
router.patch('/:id/favorite', param('id').isUUID(), toggleFavorite);
router.delete('/:id', param('id').isUUID(), deleteEntry);

export default router;