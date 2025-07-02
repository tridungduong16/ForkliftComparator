import fs from 'fs';
import path from 'path';

export interface PersistentData {
  forkliftModels: any[];
  brochures: any[];
  competitorQuotes: any[];
  distributorDetails: any[];
  lastBackup: string;
}

export class DataPersistence {
  private dataFile = path.join(process.cwd(), 'data', 'storage-backup.json');
  private uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Ensure uploads directory structure exists
    const brochuresDir = path.join(this.uploadsDir, 'brochures');
    if (!fs.existsSync(brochuresDir)) {
      fs.mkdirSync(brochuresDir, { recursive: true });
    }

    const quotesDir = path.join(this.uploadsDir, 'quotes');
    if (!fs.existsSync(quotesDir)) {
      fs.mkdirSync(quotesDir, { recursive: true });
    }
  }

  async saveData(data: PersistentData): Promise<void> {
    try {
      data.lastBackup = new Date().toISOString();
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.dataFile, jsonData, 'utf8');
    } catch (error) {
      console.error('Failed to save data:', error);
      throw new Error('Data persistence failed');
    }
  }

  async loadData(): Promise<PersistentData | null> {
    try {
      if (!fs.existsSync(this.dataFile)) {
        return null;
      }
      
      const jsonData = fs.readFileSync(this.dataFile, 'utf8');
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }

  async backupFiles(): Promise<void> {
    // Create timestamp-based backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy uploads directory
    if (fs.existsSync(this.uploadsDir)) {
      this.copyDirectory(this.uploadsDir, path.join(backupDir, 'uploads'));
    }

    // Copy data file
    if (fs.existsSync(this.dataFile)) {
      fs.copyFileSync(this.dataFile, path.join(backupDir, 'storage-backup.json'));
    }
  }

  private copyDirectory(source: string, destination: string): void {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(destination, item);

      if (fs.statSync(sourcePath).isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  async validateFileIntegrity(): Promise<{ valid: boolean; missingFiles: string[] }> {
    const data = await this.loadData();
    if (!data) {
      return { valid: true, missingFiles: [] };
    }

    const missingFiles: string[] = [];

    // Check brochure files
    for (const brochure of data.brochures) {
      if (brochure.fileUrl) {
        const filePath = path.join(process.cwd(), brochure.fileUrl);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(brochure.fileUrl);
        }
      }
    }

    return {
      valid: missingFiles.length === 0,
      missingFiles
    };
  }
}

export const dataPersistence = new DataPersistence();