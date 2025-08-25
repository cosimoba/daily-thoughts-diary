import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatar?: string;
}

interface UpdateSettingsRequest {
  theme?: string;
  defaultPrivacy?: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
  emailNotifications?: boolean;
  dailyReminder?: boolean;
  reminderTime?: string;
  language?: string;
  timezone?: string;
}

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Update user profile
export const updateProfile = async (req: Request<{}, {}, UpdateProfileRequest>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { username, email, avatar } = req.body;

    // Check if username or email already exists
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: req.user.id } },
            {
              OR: [
                ...(username ? [{ username: username.toLowerCase() }] : []),
                ...(email ? [{ email: email.toLowerCase() }] : [])
              ]
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: existingUser.username === username?.toLowerCase()
            ? 'Username already taken'
            : 'Email already in use'
        });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username: username.toLowerCase() }),
        ...(email && { email: email.toLowerCase() }),
        ...(avatar !== undefined && { avatar })
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get user settings
export const getUserSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id }
    });

    if (!settings) {
      // Create default settings if they don't exist
      const newSettings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
          theme: 'light',
          language: 'en',
          timezone: 'UTC'
        }
      });
      return res.json({ settings: newSettings });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
};

// Update user settings
export const updateSettings = async (req: Request<{}, {}, UpdateSettingsRequest>, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      theme,
      defaultPrivacy,
      emailNotifications,
      dailyReminder,
      reminderTime,
      language,
      timezone
    } = req.body;

    // Validate reminder time format if provided
    if (reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      return res.status(400).json({ error: 'Invalid reminder time format. Use HH:MM' });
    }

    // Check if settings exist
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id }
    });

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.userSettings.update({
        where: { userId: req.user.id },
        data: {
          ...(theme !== undefined && { theme }),
          ...(defaultPrivacy !== undefined && { defaultPrivacy }),
          ...(emailNotifications !== undefined && { emailNotifications }),
          ...(dailyReminder !== undefined && { dailyReminder }),
          ...(reminderTime !== undefined && { reminderTime }),
          ...(language !== undefined && { language }),
          ...(timezone !== undefined && { timezone })
        }
      });
    } else {
      // Create new settings
      settings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
          theme: theme || 'light',
          defaultPrivacy: defaultPrivacy || 'PRIVATE',
          emailNotifications: emailNotifications ?? true,
          dailyReminder: dailyReminder ?? false,
          reminderTime,
          language: language || 'en',
          timezone: timezone || 'UTC'
        }
      });
    }

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Delete user account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user and all related data (cascades)
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.params.id || req.user.id;

    // If requesting another user's stats, check privacy settings
    if (userId !== req.user.id) {
      // For now, only allow viewing own stats
      return res.status(403).json({ error: 'Access denied' });
    }

    const [
      userInfo,
      totalEntries,
      totalWords,
      totalTags,
      favoriteCount,
      moodDistribution,
      writingStreak,
      monthlyActivity
    ] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          createdAt: true
        }
      }),

      // Total entries
      prisma.entry.count({
        where: { userId }
      }),

      // Total words
      prisma.entry.aggregate({
        where: { userId },
        _sum: { wordCount: true }
      }),

      // Total unique tags
      prisma.tag.count({
        where: { userId }
      }),

      // Favorite entries
      prisma.entry.count({
        where: { userId, isFavorite: true }
      }),

      // Mood distribution
      prisma.entry.groupBy({
        by: ['mood'],
        where: { userId },
        _count: true
      }),

      // Calculate writing streak
      prisma.$queryRaw`
        WITH daily_entries AS (
          SELECT DATE(created_at) as entry_date
          FROM "Entry"
          WHERE user_id = ${userId}
          GROUP BY DATE(created_at)
          ORDER BY entry_date DESC
        ),
        streak_groups AS (
          SELECT 
            entry_date,
            entry_date - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY entry_date DESC) as streak_group
          FROM daily_entries
        )
        SELECT 
          COUNT(*) as current_streak,
          MAX(entry_date) as last_entry_date
        FROM streak_groups
        WHERE streak_group = (
          SELECT streak_group 
          FROM streak_groups 
          ORDER BY entry_date DESC 
          LIMIT 1
        )
      `,

      // Monthly activity (last 12 months)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as entry_count,
          SUM(word_count) as total_words
        FROM "Entry"
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
      `
    ]);

    // Calculate additional stats
    const averageWordsPerEntry = totalEntries > 0 
      ? Math.round((totalWords._sum.wordCount || 0) / totalEntries)
      : 0;

    const daysSinceJoined = userInfo 
      ? Math.floor((Date.now() - new Date(userInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const averageEntriesPerWeek = daysSinceJoined > 0
      ? Math.round((totalEntries / daysSinceJoined) * 7 * 10) / 10
      : 0;

    res.json({
      stats: {
        user: userInfo,
        overview: {
          totalEntries,
          totalWords: totalWords._sum.wordCount || 0,
          averageWordsPerEntry,
          totalTags,
          favoriteCount,
          daysSinceJoined,
          averageEntriesPerWeek
        },
        moodDistribution,
        writingStreak,
        monthlyActivity
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// Export user data (GDPR compliance)
export const exportUserData = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
        entries: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            attachments: true
          }
        },
        tags: true
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const exportData = {
      ...userData,
      password: undefined
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userData.username}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};