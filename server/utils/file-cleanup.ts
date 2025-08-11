import fs from "fs";
import path from "path";
import { appLogger } from "./logger";

/**
 * Clean up uploaded file with proper error handling
 */
export function cleanupUploadedFile(filePath: string, fileName: string, reason: string = "processing complete"): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      appLogger.file(`${reason} - cleaned up file: ${fileName}`);
    } else {
      appLogger.file(`File not found for cleanup: ${filePath}`);
    }
  } catch (error) {
    appLogger.file(`File cleanup error for ${fileName}:`, error);
    // Don't throw errors for cleanup failures
  }
}

/**
 * Clean up all numbered versions of a file (e.g., deck.pdf, deck-1.pdf, deck-2.pdf)
 * @param basePath - Directory containing the files
 * @param originalFileName - Original filename to find versions of
 * @param reason - Reason for cleanup (optional)
 */
export function cleanupFileVersions(basePath: string, originalFileName: string, reason: string = "processing complete"): void {
  try {
    const ext = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, ext);
    const uploadDir = path.dirname(basePath);
    
    // Clean original file
    const originalPath = path.join(uploadDir, originalFileName);
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
      appLogger.file(`${reason} - cleaned up original file: ${originalFileName}`);
    }
    
    // Clean numbered versions
    let counter = 1;
    let versionPath = path.join(uploadDir, `${baseName}-${counter}${ext}`);
    
    while (fs.existsSync(versionPath)) {
      fs.unlinkSync(versionPath);
      appLogger.file(`${reason} - cleaned up version file: ${baseName}-${counter}${ext}`);
      counter++;
      versionPath = path.join(uploadDir, `${baseName}-${counter}${ext}`);
    }
  } catch (error) {
    appLogger.file(`File versions cleanup error for ${originalFileName}:`, error);
    // Don't throw errors for cleanup failures
  }
}

/**
 * Clean up multiple files
 */
export function cleanupMultipleFiles(files: Array<{ path: string; name: string }>): void {
  files.forEach(file => {
    cleanupUploadedFile(file.path, file.name, "batch cleanup");
  });
}

/**
 * Clean up old files in upload directory (older than specified hours)
 */
export function cleanupOldFiles(uploadDir: string, maxAgeHours: number = 24): void {
  try {
    if (!fs.existsSync(uploadDir)) {
      return;
    }

    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    let cleanedCount = 0;

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      try {
        const stats = fs.statSync(filePath);
        const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > maxAgeHours) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      } catch (error) {
        appLogger.file(`Error checking file ${file}:`, error);
      }
    });

    if (cleanedCount > 0) {
      appLogger.file(`Cleaned up ${cleanedCount} old files from upload directory`);
    }
  } catch (error) {
    appLogger.file("Error during old files cleanup:", error);
  }
}

/**
 * Schedule periodic cleanup of old files
 */
export function schedulePeriodicCleanup(uploadDir: string, intervalHours: number = 6): void {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  setInterval(() => {
    cleanupOldFiles(uploadDir, 24); // Clean files older than 24 hours
  }, intervalMs);
  
  appLogger.system(`Scheduled periodic cleanup every ${intervalHours} hours`);
}