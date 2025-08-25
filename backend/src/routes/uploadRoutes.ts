import { Router } from 'express';
import { param } from 'express-validator';
import {
  upload,
  uploadFile,
  uploadMultipleFiles,
  deleteAttachment,
  getAttachment
} from '../controllers/uploadController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (with optional auth for access control)
router.get('/attachments/:id', param('id').isUUID(), optionalAuth, getAttachment);

// Protected routes
router.use(authenticate);

// File upload routes
router.post('/single', upload.single('file'), uploadFile);
router.post('/multiple', upload.array('files', 5), uploadMultipleFiles);
router.delete('/attachments/:id', param('id').isUUID(), deleteAttachment);

export default router;