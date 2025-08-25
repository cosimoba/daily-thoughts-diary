import { Request, Response } from 'express';
import { PrismaClient, AttachmentType } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Configure upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Ensure upload directory exists
const ensureUploadDir = async (subDir: string) => {
  const fullPath = path.join(UPLOAD_DIR, subDir);
  await fs.mkdir(fullPath, { recursive: true });
  return fullPath;
};

// Generate unique filename
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
};

// Determine attachment type from mime type
const getAttachmentType = (mimeType: string): AttachmentType => {
  if (mimeType.startsWith('image/')) return AttachmentType.IMAGE;
  if (mimeType.startsWith('audio/')) return AttachmentType.AUDIO;
  if (mimeType.startsWith('video/')) return AttachmentType.VIDEO;
  return AttachmentType.DOCUMENT;
};

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/mpeg',
    'video/quicktime'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Max 5 files per upload
  }
});

// Upload single file
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { entryId } = req.body;

    // Verify entry belongs to user if entryId provided
    if (entryId) {
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId: req.user.id
        }
      });

      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
    }

    // Determine file type and directory
    const attachmentType = getAttachmentType(req.file.mimetype);
    const uploadSubDir = attachmentType.toLowerCase() + 's';
    const uploadPath = await ensureUploadDir(uploadSubDir);

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);
    const filePath = path.join(uploadPath, fileName);
    const fileUrl = `/${uploadSubDir}/${fileName}`;

    // Process based on file type
    if (attachmentType === AttachmentType.IMAGE) {
      // Process image with sharp
      const processedImage = await sharp(req.file.buffer)
        .resize(1920, 1080, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      await fs.writeFile(filePath, processedImage);

      // Generate thumbnail
      const thumbnailName = `thumb_${fileName}`;
      const thumbnailPath = path.join(uploadPath, thumbnailName);
      
      await sharp(req.file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } else {
      // Save file as-is for non-images
      await fs.writeFile(filePath, req.file.buffer);
    }

    // Create attachment record if entryId provided
    let attachment = null;
    if (entryId) {
      attachment = await prisma.attachment.create({
        data: {
          entryId,
          type: attachmentType,
          url: fileUrl,
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        type: attachmentType,
        mimeType: req.file.mimetype,
        attachment
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { entryId } = req.body;

    // Verify entry belongs to user if entryId provided
    if (entryId) {
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId: req.user.id
        }
      });

      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Determine file type and directory
        const attachmentType = getAttachmentType(file.mimetype);
        const uploadSubDir = attachmentType.toLowerCase() + 's';
        const uploadPath = await ensureUploadDir(uploadSubDir);

        // Generate unique filename
        const fileName = generateFileName(file.originalname);
        const filePath = path.join(uploadPath, fileName);
        const fileUrl = `/${uploadSubDir}/${fileName}`;

        // Process based on file type
        if (attachmentType === AttachmentType.IMAGE) {
          // Process image with sharp
          const processedImage = await sharp(file.buffer)
            .resize(1920, 1080, { 
              fit: 'inside', 
              withoutEnlargement: true 
            })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();

          await fs.writeFile(filePath, processedImage);

          // Generate thumbnail
          const thumbnailName = `thumb_${fileName}`;
          const thumbnailPath = path.join(uploadPath, thumbnailName);
          
          await sharp(file.buffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        } else {
          // Save file as-is for non-images
          await fs.writeFile(filePath, file.buffer);
        }

        // Create attachment record if entryId provided
        let attachment = null;
        if (entryId) {
          attachment = await prisma.attachment.create({
            data: {
              entryId,
              type: attachmentType,
              url: fileUrl,
              filename: file.originalname,
              size: file.size,
              mimeType: file.mimetype
            }
          });
        }

        uploadedFiles.push({
          url: fileUrl,
          filename: file.originalname,
          size: file.size,
          type: attachmentType,
          mimeType: file.mimetype,
          attachment
        });
      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError);
        uploadedFiles.push({
          filename: file.originalname,
          error: 'Failed to upload'
        });
      }
    }

    res.json({
      message: 'Files processed',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
};

// Delete attachment
export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Find attachment and verify ownership
    const attachment = await prisma.attachment.findFirst({
      where: { id },
      include: {
        entry: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (attachment.entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), UPLOAD_DIR, attachment.url.substring(1));
      await fs.unlink(filePath);

      // Delete thumbnail if it's an image
      if (attachment.type === AttachmentType.IMAGE) {
        const fileName = path.basename(attachment.url);
        const thumbnailPath = path.join(path.dirname(filePath), `thumb_${fileName}`);
        await fs.unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id }
    });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

// Get attachment
export const getAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        entry: {
          select: {
            userId: true,
            privacy: true
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check access permissions
    if (attachment.entry.privacy === 'PRIVATE') {
      if (!req.user || attachment.entry.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ attachment });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ error: 'Failed to fetch attachment' });
  }
};

// Update user avatar
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate image type
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image type' });
    }

    // Create avatars directory
    const avatarPath = await ensureUploadDir('avatars');
    const fileName = `avatar_${req.user.id}_${Date.now()}.jpg`;
    const filePath = path.join(avatarPath, fileName);
    const fileUrl = `/avatars/${fileName}`;

    // Process avatar image
    await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(filePath);

    // Get old avatar to delete
    const oldUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatar: true }
    });

    // Update user avatar
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: fileUrl },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true
      }
    });

    // Delete old avatar if exists
    if (oldUser?.avatar && oldUser.avatar.startsWith('/avatars/')) {
      try {
        const oldFilePath = path.join(process.cwd(), UPLOAD_DIR, oldUser.avatar.substring(1));
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    res.json({
      message: 'Avatar uploaded successfully',
      user
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};