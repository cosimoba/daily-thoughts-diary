#!/usr/bin/env node

import { databaseBackup } from '../utils/database';
import { program } from 'commander';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

program
  .name('backup')
  .description('Database backup utility for Daily Thoughts Diary')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new database backup')
  .option('-o, --output <path>', 'Output directory for backup file')
  .option('-c, --compress', 'Compress the backup file', false)
  .option('-s, --schema', 'Include schema in backup', false)
  .action(async (options) => {
    try {
      console.log('Creating database backup...');
      const filepath = await databaseBackup.createBackup({
        outputDir: options.output,
        compress: options.compress,
        includeSchema: options.schema
      });
      console.log(`Backup created successfully: ${filepath}`);
      process.exit(0);
    } catch (error) {
      console.error('Backup failed:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available backups')
  .action(async () => {
    try {
      const backups = await databaseBackup.listBackups();
      if (backups.length === 0) {
        console.log('No backups found');
      } else {
        console.log('\nAvailable backups:');
        console.log('==================');
        backups.forEach((backup, index) => {
          const sizeInMB = (backup.size / (1024 * 1024)).toFixed(2);
          console.log(`${index + 1}. ${backup.filename}`);
          console.log(`   Size: ${sizeInMB} MB`);
          console.log(`   Created: ${backup.created.toLocaleString()}`);
          console.log('');
        });
      }
      process.exit(0);
    } catch (error) {
      console.error('Failed to list backups:', error);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Delete old backups')
  .option('-d, --days <number>', 'Number of days to keep', '30')
  .action(async (options) => {
    try {
      const daysToKeep = parseInt(options.days);
      console.log(`Deleting backups older than ${daysToKeep} days...`);
      const deletedCount = await databaseBackup.deleteOldBackups(daysToKeep);
      console.log(`Deleted ${deletedCount} old backup(s)`);
      process.exit(0);
    } catch (error) {
      console.error('Failed to clean backups:', error);
      process.exit(1);
    }
  });

program
  .command('schedule')
  .description('Show backup schedule information')
  .action(() => {
    console.log('\nBackup Schedule Configuration:');
    console.log('==============================');
    console.log('Daily backups: 2:00 AM (server time)');
    console.log('Retention: 30 days');
    console.log('Compression: Enabled');
    console.log('\nTo modify the schedule, update the environment variables:');
    console.log('- BACKUP_HOUR (0-23)');
    console.log('- BACKUP_MINUTE (0-59)');
    console.log('- BACKUP_RETENTION_DAYS');
    process.exit(0);
  });

program.parse(process.argv);