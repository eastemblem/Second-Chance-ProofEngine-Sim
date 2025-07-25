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