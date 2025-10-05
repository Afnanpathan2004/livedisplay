const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logger } = require('./logger');
const { auditLog } = require('./audit');

/**
 * Production-ready file management system
 * Handles secure file uploads, processing, and storage
 */
class FileManager {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = (process.env.ALLOWED_FILE_TYPES || 
      'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .split(',');
    
    this.imageFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.documentFormats = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    this.initializeDirectories();
  }

  /**
   * Initialize upload directories
   */
  async initializeDirectories() {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'profiles'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'assets'),
      path.join(this.uploadDir, 'temp'),
      path.join(this.uploadDir, 'processed'),
      path.join(this.uploadDir, 'thumbnails')
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logger.error('Failed to create upload directory', {
          directory: dir,
          error: error.message
        });
      }
    }
  }

  /**
   * Generate secure filename
   */
  generateSecureFilename(originalName, userId) {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('md5').update(`${userId}-${timestamp}-${random}`).digest('hex');
    
    return `${hash}${ext}`;
  }

  /**
   * Validate file security
   */
  async validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar', '.vbs', '.js', '.php'];
    
    if (dangerousExtensions.includes(ext)) {
      errors.push('File extension not allowed for security reasons');
    }

    // Validate file content matches extension (basic check)
    if (this.imageFormats.includes(file.mimetype)) {
      try {
        await sharp(file.buffer).metadata();
      } catch (error) {
        errors.push('Invalid image file content');
      }
    }

    // Check for embedded scripts in files
    if (file.buffer) {
      const content = file.buffer.toString('utf8', 0, Math.min(1024, file.buffer.length));
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /data:text\/html/i,
        /<%/,
        /<\?php/i
      ];

      for (const pattern of scriptPatterns) {
        if (pattern.test(content)) {
          errors.push('File contains potentially malicious content');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process uploaded file
   */
  async processFile(file, options = {}) {
    const {
      userId,
      category = 'general',
      resize = null,
      generateThumbnail = false,
      watermark = null
    } = options;

    try {
      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate secure filename
      const filename = this.generateSecureFilename(file.originalname, userId);
      const categoryDir = path.join(this.uploadDir, category);
      const filePath = path.join(categoryDir, filename);

      // Ensure category directory exists
      await fs.mkdir(categoryDir, { recursive: true });

      let processedBuffer = file.buffer;

      // Process images
      if (this.imageFormats.includes(file.mimetype)) {
        processedBuffer = await this.processImage(file.buffer, {
          resize,
          watermark,
          quality: 85
        });

        // Generate thumbnail if requested
        if (generateThumbnail) {
          await this.generateThumbnail(processedBuffer, filename, category);
        }
      }

      // Save file
      await fs.writeFile(filePath, processedBuffer);

      // Create file record
      const fileRecord = {
        id: crypto.randomUUID(),
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: processedBuffer.length,
        category,
        path: filePath,
        relativePath: path.join(category, filename),
        uploadedBy: userId,
        uploadedAt: new Date(),
        metadata: {
          width: null,
          height: null,
          format: null
        }
      };

      // Get image metadata
      if (this.imageFormats.includes(file.mimetype)) {
        try {
          const metadata = await sharp(processedBuffer).metadata();
          fileRecord.metadata = {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            channels: metadata.channels,
            density: metadata.density
          };
        } catch (error) {
          logger.warn('Failed to extract image metadata', {
            filename,
            error: error.message
          });
        }
      }

      // Audit log
      await auditLog(userId, 'FILE_UPLOAD', 'file', fileRecord.id, null, fileRecord, {
        ip: options.ip,
        userAgent: options.userAgent
      });

      logger.info('File uploaded successfully', {
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        size: fileRecord.size,
        category,
        userId
      });

      return fileRecord;

    } catch (error) {
      logger.error('File processing failed', {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process image with optimization
   */
  async processImage(buffer, options = {}) {
    const {
      resize = null,
      watermark = null,
      quality = 85,
      format = null
    } = options;

    let image = sharp(buffer);

    // Resize if specified
    if (resize) {
      if (resize.width || resize.height) {
        image = image.resize(resize.width, resize.height, {
          fit: resize.fit || 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Add watermark if specified
    if (watermark) {
      try {
        const watermarkBuffer = await fs.readFile(watermark.path);
        image = image.composite([{
          input: watermarkBuffer,
          gravity: watermark.position || 'southeast',
          blend: 'overlay'
        }]);
      } catch (error) {
        logger.warn('Failed to apply watermark', {
          watermark: watermark.path,
          error: error.message
        });
      }
    }

    // Optimize and convert
    if (format === 'webp') {
      image = image.webp({ quality });
    } else if (format === 'jpeg') {
      image = image.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      image = image.png({ compressionLevel: 9 });
    } else {
      // Auto-optimize based on original format
      const metadata = await sharp(buffer).metadata();
      if (metadata.format === 'jpeg') {
        image = image.jpeg({ quality, progressive: true });
      } else if (metadata.format === 'png') {
        image = image.png({ compressionLevel: 9 });
      }
    }

    return image.toBuffer();
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(buffer, filename, category) {
    const thumbnailDir = path.join(this.uploadDir, 'thumbnails', category);
    await fs.mkdir(thumbnailDir, { recursive: true });

    const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);
    
    const thumbnail = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    await fs.writeFile(thumbnailPath, thumbnail);
    
    return thumbnailPath;
  }

  /**
   * Delete file securely
   */
  async deleteFile(filePath, userId) {
    try {
      // Verify file exists
      await fs.access(filePath);
      
      // Secure deletion (overwrite before delete)
      const stats = await fs.stat(filePath);
      const randomData = crypto.randomBytes(stats.size);
      
      await fs.writeFile(filePath, randomData);
      await fs.unlink(filePath);

      // Delete thumbnail if exists
      const filename = path.basename(filePath);
      const category = path.basename(path.dirname(filePath));
      const thumbnailPath = path.join(this.uploadDir, 'thumbnails', category, `thumb_${filename}`);
      
      try {
        await fs.unlink(thumbnailPath);
      } catch (error) {
        // Thumbnail might not exist, ignore error
      }

      // Audit log
      await auditLog(userId, 'FILE_DELETE', 'file', filename, { path: filePath }, null);

      logger.info('File deleted successfully', {
        filePath,
        userId
      });

      return true;

    } catch (error) {
      logger.error('File deletion failed', {
        filePath,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get file stream for download
   */
  async getFileStream(filePath) {
    try {
      await fs.access(filePath);
      return require('fs').createReadStream(filePath);
    } catch (error) {
      throw new Error('File not found');
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const tempDir = path.join(this.uploadDir, 'temp');
    
    try {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info('Temporary files cleaned up', {
        deletedCount,
        maxAge: `${maxAge / (60 * 60 * 1000)} hours`
      });

      return deletedCount;

    } catch (error) {
      logger.error('Temp file cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      categories: {},
      oldestFile: null,
      newestFile: null
    };

    try {
      const categories = await fs.readdir(this.uploadDir);
      
      for (const category of categories) {
        const categoryPath = path.join(this.uploadDir, category);
        const categoryStat = await fs.stat(categoryPath);
        
        if (!categoryStat.isDirectory()) continue;

        const files = await fs.readdir(categoryPath);
        let categorySize = 0;
        let categoryFiles = 0;

        for (const file of files) {
          const filePath = path.join(categoryPath, file);
          const fileStat = await fs.stat(filePath);
          
          if (fileStat.isFile()) {
            categorySize += fileStat.size;
            categoryFiles++;
            
            if (!stats.oldestFile || fileStat.mtime < stats.oldestFile.mtime) {
              stats.oldestFile = { path: filePath, mtime: fileStat.mtime };
            }
            
            if (!stats.newestFile || fileStat.mtime > stats.newestFile.mtime) {
              stats.newestFile = { path: filePath, mtime: fileStat.mtime };
            }
          }
        }

        stats.categories[category] = {
          files: categoryFiles,
          size: categorySize,
          sizeFormatted: this.formatBytes(categorySize)
        };

        stats.totalFiles += categoryFiles;
        stats.totalSize += categorySize;
      }

      stats.totalSizeFormatted = this.formatBytes(stats.totalSize);

      return stats;

    } catch (error) {
      logger.error('Failed to get storage stats', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Create multer configuration
   */
  createMulterConfig(options = {}) {
    const {
      category = 'general',
      maxFiles = 10,
      fileFilter = null
    } = options;

    const storage = multer.memoryStorage();

    const defaultFileFilter = (req, file, cb) => {
      // Check MIME type
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }

      // Check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar'];
      
      if (dangerousExtensions.includes(ext)) {
        return cb(new Error('File extension not allowed'), false);
      }

      cb(null, true);
    };

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: maxFiles
      },
      fileFilter: fileFilter || defaultFileFilter
    });
  }
}

// Create singleton instance
const fileManager = new FileManager();

module.exports = {
  fileManager,
  
  // Middleware for file uploads
  uploadMiddleware: (category = 'general', options = {}) => {
    const upload = fileManager.createMulterConfig({ category, ...options });
    
    return (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          logger.error('File upload middleware error', {
            error: err.message,
            category,
            userId: req.user?.id
          });
          
          return res.status(400).json({
            error: 'File upload failed',
            message: err.message
          });
        }
        
        next();
      });
    };
  },

  // Multiple file upload middleware
  uploadMultipleMiddleware: (category = 'general', maxFiles = 10, options = {}) => {
    const upload = fileManager.createMulterConfig({ category, maxFiles, ...options });
    
    return (req, res, next) => {
      upload.array('files', maxFiles)(req, res, (err) => {
        if (err) {
          logger.error('Multiple file upload middleware error', {
            error: err.message,
            category,
            maxFiles,
            userId: req.user?.id
          });
          
          return res.status(400).json({
            error: 'File upload failed',
            message: err.message
          });
        }
        
        next();
      });
    };
  }
};
