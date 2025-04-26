const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

class BackupService {
    static async createBackup(data, filename) {
        return new Promise((resolve, reject) => {
            // Create a write stream for the backup file
            const output = fs.createWriteStream(path.join(__dirname, '../backups', filename));
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            // Listen for events
            output.on('close', () => {
                resolve({
                    success: true,
                    message: `Backup created successfully. Size: ${archive.pointer()} bytes`,
                    filename: filename
                });
            });

            archive.on('error', (err) => {
                reject(err);
            });

            // Pipe archive data to the file
            archive.pipe(output);

            // Add the JSON data to the archive
            archive.append(JSON.stringify(data, null, 2), { name: 'data.json' });

            // Finalize the archive
            archive.finalize();
        });
    }

    static async restoreBackup(filePath) {
        try {
            // Read the backup file
            const fileContent = fs.readFileSync(filePath);
            
            // Extract the JSON data
            // Note: In a real implementation, you would need to handle ZIP extraction
            // This is a simplified version that assumes direct JSON file reading
            const data = JSON.parse(fileContent);
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            throw new Error(`Failed to restore backup: ${error.message}`);
        }
    }

    static async listBackups() {
        try {
            const backupDir = path.join(__dirname, '../backups');
            
            // Create backups directory if it doesn't exist
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const files = fs.readdirSync(backupDir);
            return files.filter(file => file.endsWith('.zip'))
                .map(file => ({
                    filename: file,
                    path: path.join(backupDir, file),
                    created: fs.statSync(path.join(backupDir, file)).birthtime
                }));
        } catch (error) {
            throw new Error(`Failed to list backups: ${error.message}`);
        }
    }

    static async deleteBackup(filename) {
        try {
            const backupPath = path.join(__dirname, '../backups', filename);
            fs.unlinkSync(backupPath);
            return {
                success: true,
                message: `Backup ${filename} deleted successfully`
            };
        } catch (error) {
            throw new Error(`Failed to delete backup: ${error.message}`);
        }
    }
}

module.exports = BackupService; 