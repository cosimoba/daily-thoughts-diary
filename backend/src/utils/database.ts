import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  includeSchema?: boolean;
}

interface RestoreOptions {
  inputFile: string;
  dropExisting?: boolean;
}

// Database backup functionality
export class DatabaseBackup {
  private backupDir: string;

  constructor(backupDir: string = 'backups') {
    this.backupDir = backupDir;
  }

  async ensureBackupDir(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async createBackup(options: BackupOptions = {}): Promise<string> {
    try {
      await this.ensureBackupDir();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      const filepath = path.join(options.outputDir || this.backupDir, filename);

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.substring(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable for pg_dump
      const env = { ...process.env, PGPASSWORD: password };

      // Build pg_dump command
      let command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName}`;
      
      if (!options.includeSchema) {
        command += ' --data-only';
      }

      if (options.compress) {
        command += ` | gzip > ${filepath}.gz`;
      } else {
        command += ` > ${filepath}`;
      }

      // Execute backup
      await execAsync(command, { env });

      const finalPath = options.compress ? `${filepath}.gz` : filepath;
      const stats = await fs.stat(finalPath);

      console.log(`Backup created successfully: ${finalPath} (${this.formatBytes(stats.size)})`);
      
      return finalPath;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  async restoreBackup(options: RestoreOptions): Promise<void> {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Check if backup file exists
      await fs.access(options.inputFile);

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.substring(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: password };

      // Drop existing database if requested
      if (options.dropExisting) {
        await execAsync(
          `psql -h ${host} -p ${port} -U ${username} -c "DROP DATABASE IF EXISTS ${dbName}"`,
          { env }
        );
        await execAsync(
          `psql -h ${host} -p ${port} -U ${username} -c "CREATE DATABASE ${dbName}"`,
          { env }
        );
      }

      // Build restore command
      let command: string;
      if (options.inputFile.endsWith('.gz')) {
        command = `gunzip -c ${options.inputFile} | psql -h ${host} -p ${port} -U ${username} -d ${dbName}`;
      } else {
        command = `psql -h ${host} -p ${port} -U ${username} -d ${dbName} < ${options.inputFile}`;
      }

      // Execute restore
      await execAsync(command, { env });

      console.log(`Database restored successfully from: ${options.inputFile}`);
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async listBackups(): Promise<Array<{ filename: string; size: number; created: Date }>> {
    try {
      await this.ensureBackupDir();
      const files = await fs.readdir(this.backupDir);
      
      const backups = await Promise.all(
        files
          .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
          .map(async (filename) => {
            const filepath = path.join(this.backupDir, filename);
            const stats = await fs.stat(filepath);
            return {
              filename,
              size: stats.size,
              created: stats.birthtime
            };
          })
      );

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  async deleteOldBackups(daysToKeep: number = 30): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;
      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          await fs.unlink(path.join(this.backupDir, backup.filename));
          deletedCount++;
          console.log(`Deleted old backup: ${backup.filename}`);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to delete old backups:', error);
      throw error;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Database optimization
export class DatabaseOptimizer {
  async analyzeDatabase(): Promise<void> {
    try {
      // Run ANALYZE to update statistics
      await prisma.$executeRaw`ANALYZE`;
      console.log('Database statistics updated');
    } catch (error) {
      console.error('Failed to analyze database:', error);
      throw error;
    }
  }

  async vacuum(full: boolean = false): Promise<void> {
    try {
      if (full) {
        await prisma.$executeRaw`VACUUM FULL`;
        console.log('Full vacuum completed');
      } else {
        await prisma.$executeRaw`VACUUM`;
        console.log('Vacuum completed');
      }
    } catch (error) {
      console.error('Failed to vacuum database:', error);
      throw error;
    }
  }

  async reindex(): Promise<void> {
    try {
      await prisma.$executeRaw`REINDEX DATABASE CONCURRENTLY ${process.env.DB_NAME || 'daily_thoughts'}`;
      console.log('Database reindexed');
    } catch (error) {
      console.error('Failed to reindex database:', error);
      throw error;
    }
  }

  async getTableSizes(): Promise<any[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;
      return result as any[];
    } catch (error) {
      console.error('Failed to get table sizes:', error);
      throw error;
    }
  }

  async getDatabaseSize(): Promise<string> {
    try {
      const result = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      return (result as any)[0].size;
    } catch (error) {
      console.error('Failed to get database size:', error);
      throw error;
    }
  }

  async getIndexUsage(): Promise<any[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `;
      return result as any[];
    } catch (error) {
      console.error('Failed to get index usage:', error);
      throw error;
    }
  }

  async getSlowQueries(limit: number = 10): Promise<any[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time,
          min_time,
          stddev_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_time DESC
        LIMIT ${limit}
      `;
      return result as any[];
    } catch (error) {
      console.error('Failed to get slow queries (pg_stat_statements may not be enabled):', error);
      return [];
    }
  }
}

// Scheduled backup jobs
export class BackupScheduler {
  private backup: DatabaseBackup;
  private optimizer: DatabaseOptimizer;

  constructor() {
    this.backup = new DatabaseBackup();
    this.optimizer = new DatabaseOptimizer();
  }

  startDailyBackup(hour: number = 2, minute: number = 0): void {
    const schedule = `${minute} ${hour} * * *`;
    
    cron.schedule(schedule, async () => {
      console.log('Starting scheduled daily backup...');
      try {
        const filepath = await this.backup.createBackup({ compress: true });
        console.log(`Daily backup completed: ${filepath}`);
        
        // Clean up old backups (keep last 30 days)
        const deleted = await this.backup.deleteOldBackups(30);
        if (deleted > 0) {
          console.log(`Cleaned up ${deleted} old backup(s)`);
        }
      } catch (error) {
        console.error('Daily backup failed:', error);
      }
    });

    console.log(`Daily backup scheduled at ${hour}:${minute < 10 ? '0' + minute : minute}`);
  }

  startWeeklyOptimization(dayOfWeek: number = 0, hour: number = 3): void {
    const schedule = `0 ${hour} * * ${dayOfWeek}`;
    
    cron.schedule(schedule, async () => {
      console.log('Starting scheduled database optimization...');
      try {
        await this.optimizer.analyzeDatabase();
        await this.optimizer.vacuum(false);
        console.log('Database optimization completed');
      } catch (error) {
        console.error('Database optimization failed:', error);
      }
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log(`Weekly optimization scheduled for ${days[dayOfWeek]} at ${hour}:00`);
  }
}

// Export instances
export const databaseBackup = new DatabaseBackup();
export const databaseOptimizer = new DatabaseOptimizer();
export const backupScheduler = new BackupScheduler();