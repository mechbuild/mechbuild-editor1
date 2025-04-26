import { parseDXFFile } from '../services/dxfParser';
import { generateProjectPdf } from '../services/generateProjectPdf';
import { createProjectStructure, validateProjectStructure } from '../services/projectManager';
import { backupProject, restoreProject, autoBackup, cleanupBackups } from '../services/backup';
import { AppError } from '../services/errorHandler';
import fs from 'fs';
import path from 'path';

describe('Entegrasyon Testleri', () => {
  // DXF Dosya Testi
  test('DXF dosya analizi', async () => {
    const testFile = new File(['LAYER\nNAME Sprinkler\n'], 'test.dxf', { type: 'application/dxf' });
    const result = await parseDXFFile(testFile);
    
    expect(result.status).toBe(true);
    expect(result.layers).toHaveProperty('Sprinkler');
    expect(result.notes).toBeDefined();
  });

  // PDF Oluşturma Testi
  test('PDF oluşturma', async () => {
    const projectName = 'Test_Projesi';
    const summaryText = 'Bu bir test özetidir.';
    const aiNotes = ['Test notu 1', 'Test notu 2'];

    const result = await generateProjectPdf(projectName, summaryText, aiNotes);
    expect(result).toContain('_Rapor.pdf');
  });

  // Proje Yapısı Testi
  test('Proje yapısı oluşturma ve doğrulama', async () => {
    const projectName = 'Test_Projesi';
    
    // Proje yapısını oluştur
    const projectPaths = await createProjectStructure(projectName);
    expect(projectPaths.status).toBe('success');
    
    // Proje yapısını doğrula
    const validation = await validateProjectStructure(projectPaths);
    expect(validation.status).toBe('success');
  });

  // Hata Yönetimi Testi
  test('Hata yönetimi', () => {
    const error = new AppError('Test hatası', 'error', 400);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test hatası');
    expect(error.type).toBe('error');
    expect(error.code).toBe(400);
  });

  // Dosya Yükleme Testi
  test('Dosya yükleme validasyonu', async () => {
    const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

    // Geçerli dosya
    expect(() => validateFile(validFile)).not.toThrow();

    // Geçersiz dosya türü
    expect(() => validateFile(invalidFile)).toThrow();

    // Büyük dosya
    expect(() => validateFile(largeFile)).toThrow();
  });

  // Yedekleme Servisi Entegrasyon Testleri
  describe('Yedekleme Servisi Entegrasyonu', () => {
    const testProjectPath = '/mnt/data/projects/test-project';
    const testBackupPath = '/mnt/data/backups';

    beforeAll(() => {
      // Test projesi oluştur
      if (!fs.existsSync(testProjectPath)) {
        fs.mkdirSync(testProjectPath, { recursive: true });
      }
      // Test DXF dosyası oluştur
      fs.writeFileSync(
        path.join(testProjectPath, 'test.dxf'),
        'LAYER\nNAME Sprinkler\n'
      );
    });

    afterAll(() => {
      // Test dizinlerini temizle
      if (fs.existsSync(testProjectPath)) {
        fs.rmSync(testProjectPath, { recursive: true });
      }
      if (fs.existsSync(testBackupPath)) {
        fs.rmSync(testBackupPath, { recursive: true });
      }
    });

    test('Proje yedekleme ve geri yükleme entegrasyonu', async () => {
      // 1. Proje yapısını oluştur
      const projectPaths = await createProjectStructure('Test_Projesi');
      expect(projectPaths.status).toBe('success');

      // 2. Projeyi yedekle
      const backupResult = await backupProject(projectPaths.projectPath);
      expect(backupResult.status).toBe('success');
      expect(fs.existsSync(backupResult.backupPath)).toBe(true);

      // 3. Yedekten geri yükle
      const restorePath = '/mnt/data/projects/restored-project';
      const restoreResult = await restoreProject(backupResult.backupPath, restorePath);
      expect(restoreResult.status).toBe('success');
      expect(fs.existsSync(restorePath)).toBe(true);

      // 4. Geri yüklenen projeyi doğrula
      const validation = await validateProjectStructure({ projectPath: restorePath });
      expect(validation.status).toBe('success');
    });

    test('Otomatik yedekleme ve temizleme entegrasyonu', async () => {
      // 1. Otomatik yedekleme çalıştır
      const backupResult = await autoBackup();
      expect(backupResult.status).toBe('success');
      expect(backupResult.backups.length).toBeGreaterThan(0);

      // 2. Yedekleri temizle
      const cleanupResult = await cleanupBackups(0); // Tüm yedekleri temizle
      expect(cleanupResult.status).toBe('success');
      expect(cleanupResult.deleted.length).toBeGreaterThan(0);

      // 3. Yedek dizininin boş olduğunu doğrula
      const remainingBackups = fs.readdirSync(testBackupPath);
      expect(remainingBackups.length).toBe(0);
    });

    test('Hata durumları entegrasyonu', async () => {
      // 1. Geçersiz proje yolu ile yedekleme
      const invalidBackup = await backupProject('/nonexistent/path');
      expect(invalidBackup.status).toBe('error');
      expect(invalidBackup.message).toBe('Proje dizini bulunamadı');

      // 2. Geçersiz yedek dosyası ile geri yükleme
      const invalidRestore = await restoreProject('/nonexistent/backup.tar.gz', '/mnt/data/projects/restore');
      expect(invalidRestore.status).toBe('error');
      expect(invalidRestore.message).toBe('Yedek dosyası bulunamadı');
    });
  });
}); 