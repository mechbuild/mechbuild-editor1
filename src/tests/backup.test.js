import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { backupProject, restoreProject, autoBackup, cleanupBackups } from '../services/backup';
import fs from 'fs';
import path from 'path';

describe('Backup Service', () => {
  const testProjectPath = '/mnt/data/projects/test-project';
  const testBackupPath = '/mnt/data/backups';

  beforeAll(() => {
    // Create test project directory
    if (!fs.existsSync(testProjectPath)) {
      fs.mkdirSync(testProjectPath, { recursive: true });
    }
    // Create test file
    fs.writeFileSync(
      path.join(testProjectPath, 'test.txt'),
      'Test content'
    );
  });

  afterAll(() => {
    // Cleanup test directories
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true });
    }
    if (fs.existsSync(testBackupPath)) {
      fs.rmSync(testBackupPath, { recursive: true });
    }
  });

  it('should create a project backup', async () => {
    const result = await backupProject(testProjectPath);
    
    expect(result.status).toBe('success');
    expect(result.backupPath).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(result.size).toBeGreaterThan(0);
    expect(fs.existsSync(result.backupPath)).toBe(true);
  });

  it('should restore a project from backup', async () => {
    // First create a backup
    const backup = await backupProject(testProjectPath);
    
    // Create a new directory for restoration
    const restorePath = '/mnt/data/projects/restored-project';
    if (!fs.existsSync(restorePath)) {
      fs.mkdirSync(restorePath, { recursive: true });
    }

    const result = await restoreProject(backup.backupPath, restorePath);
    
    expect(result.status).toBe('success');
    expect(result.restoredPath).toBe(restorePath);
    expect(result.timestamp).toBeDefined();
    expect(fs.existsSync(path.join(restorePath, 'restored.tar.gz'))).toBe(true);
  });

  it('should perform automatic backup of all projects', async () => {
    const result = await autoBackup();
    
    expect(result.status).toBe('success');
    expect(result.backups).toBeInstanceOf(Array);
    expect(result.backups.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();
  });

  it('should cleanup old backups', async () => {
    // Create a backup
    await backupProject(testProjectPath);
    
    // Set maxAge to 0 to force cleanup
    const result = await cleanupBackups(0);
    
    expect(result.status).toBe('success');
    expect(result.deleted).toBeInstanceOf(Array);
    expect(result.timestamp).toBeDefined();
  });

  it('should handle non-existent project directory', async () => {
    const result = await backupProject('/nonexistent/path');
    
    expect(result.status).toBe('error');
    expect(result.message).toBe('Proje dizini bulunamadı');
  });

  it('should handle non-existent backup file during restore', async () => {
    const result = await restoreProject('/nonexistent/backup.tar.gz', '/mnt/data/projects/restore');
    
    expect(result.status).toBe('error');
    expect(result.message).toBe('Yedek dosyası bulunamadı');
  });
}); 