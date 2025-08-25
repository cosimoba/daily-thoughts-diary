import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getUserProfile,
  updateProfile,
  getUserSettings,
  updateSettings,
  deleteAccount,
  getUserStats,
  exportUserData
} from '../controllers/userController';
import { uploadAvatar } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../controllers/uploadController';

const router = Router();

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

const updateSettingsValidation = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme'),
  body('defaultPrivacy')
    .optional()
    .isIn(['PRIVATE', 'PUBLIC', 'FRIENDS'])
    .withMessage('Invalid privacy setting'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('dailyReminder')
    .optional()
    .isBoolean()
    .withMessage('Daily reminder must be a boolean'),
  body('reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM format'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ru'])
    .withMessage('Invalid language'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string')
];

// Public routes (limited profile information)
router.get('/profile/:id', param('id').isUUID(), getUserProfile);

// Protected routes
router.use(authenticate);

// Profile management
router.get('/profile', getUserProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Settings management
router.get('/settings', getUserSettings);
router.put('/settings', updateSettingsValidation, updateSettings);

// Statistics and data
router.get('/stats', getUserStats);
router.get('/stats/:id', param('id').isUUID(), getUserStats);
router.get('/export', exportUserData);

// Account management
router.delete('/account', deleteAccount);

export default router;