#!/usr/bin/env node

import { databaseBackup } from '../utils/database';
import { program } from 'commander';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

program
  .name('restore')
  .description('Database restore utility for Daily Thoughts Diary')
  .version('1.0.0');

program
  .command('from-file')
  .description('Restore database from a backup file')
  .argument('<filepath>', 'Path to the backup file')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .option('-d, --drop', 'Drop existing database before restore', false)
  .action(async (filepath, options) => {
    try {
      if (!options.force) {
        console.log('\n⚠️  WARNING: This will restore the database from a backup file.');
        if (options.drop) {
          console.log('⚠️  The existing database will be DROPPED and all current data will be LOST!');
        } else {
          console.log('⚠️  Existing data may be overwritten!');
        }
        
        const answer = await askQuestion('\nAre you sure you want to continue? (yes/no): ');
        if (answer.toLowerCase() !== 'yes') {
          console.log('Restore cancelled');
          process.exit(0);
        }
      }

      console.log(`\nRestoring database from: ${filepath}`);
      await databaseBackup.restoreBackup({
        inputFile: filepath,
        dropExisting: options.drop
      });
      console.log('Database restored successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Restore failed:', error);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

program
  .command('list')
  .description('List available backups to restore from')
  .action(async () => {
    try {
      const backups = await databaseBackup.listBackups();
      if (backups.length === 0) {
        console.log('No backups found');
      } else {
        console.log('\nAvailable backups for restore:');
        console.log('==============================');
        backups.forEach((backup, index) => {
          const sizeInMB = (backup.size / (1024 * 1024)).toFixed(2);
          console.log(`${index + 1}. ${backup.filename}`);
          console.log(`   Size: ${sizeInMB} MB`);
          console.log(`   Created: ${backup.created.toLocaleString()}`);
          console.log(`   Command: npm run restore from-file backups/${backup.filename}`);
          console.log('');
        });
      }
      process.exit(0);
    } catch (error) {
      console.error('Failed to list backups:', error);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

program
  .command('latest')
  .description('Restore from the most recent backup')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .option('-d, --drop', 'Drop existing database before restore', false)
  .action(async (options) => {
    try {
      const backups = await databaseBackup.listBackups();
      if (backups.length === 0) {
        console.log('No backups found');
        process.exit(1);
      }

      const latestBackup = backups[0];
      const backupPath = `backups/${latestBackup.filename}`;

      if (!options.force) {
        console.log(`\n⚠️  WARNING: This will restore from the latest backup: ${latestBackup.filename}`);
        console.log(`   Created: ${latestBackup.created.toLocaleString()}`);
        if (options.drop) {
          console.log('⚠️  The existing database will be DROPPED and all current data will be LOST!');
        } else {
          console.log('⚠️  Existing data may be overwritten!');
        }
        
        const answer = await askQuestion('\nAre you sure you want to continue? (yes/no): ');
        if (answer.toLowerCase() !== 'yes') {
          console.log('Restore cancelled');
          process.exit(0);
        }
      }

      console.log(`\nRestoring database from latest backup: ${backupPath}`);
      await databaseBackup.restoreBackup({
        inputFile: backupPath,
        dropExisting: options.drop
      });
      console.log('Database restored successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Restore failed:', error);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

program.parse(process.argv);