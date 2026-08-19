import fs from 'fs';
import path from 'path';
import { logger } from '@/server/config/logger';

export class PDFExportSync {
  private static LOCAL_DIR = process.env.LOCAL_ARCHIVE_PATH || path.join(process.cwd(), 'local_archives');

  public static async exportToLocalFolder(fileName: string, pdfBuffer: Buffer) {
    try {
      // Ensure directory exists
      if (!fs.existsSync(this.LOCAL_DIR)) {
        fs.mkdirSync(this.LOCAL_DIR, { recursive: true });
      }

      const filePath = path.join(this.LOCAL_DIR, fileName);
      
      // Write the file asynchronously so we don't block the Node event loop
      await fs.promises.writeFile(filePath, pdfBuffer);
      logger.info(`[PDFExportSync] Successfully exported ${fileName} to local folder.`);
      
    } catch (error: any) {
      logger.error(`[PDFExportSync] Failed to export ${fileName} to local folder: ${error.message}`);
    }
  }
}
