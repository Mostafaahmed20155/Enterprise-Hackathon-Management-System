import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private config: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.config.get<string>('S3_ENDPOINT')!,
      region: this.config.get<string>('S3_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE') === 'true',
    });

    this.bucketName = this.config.get<string>('S3_BUCKET_NAME')!;
  }

  /**
   * Upload file to S3
   * Supports Arabic filenames via UTF-8 encoding
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number; key: string }> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename to avoid conflicts
    const ext = path.extname(file.originalname);
    const randomId = crypto.randomBytes(16).toString('hex');

    // Preserve original filename in metadata (supports Arabic)
    const originalFilename = Buffer.from(file.originalname, 'utf-8').toString('utf-8');

    // Use UUID for actual S3 key
    const key = `${folder}/${randomId}${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalname: encodeURIComponent(originalFilename), // Encode Arabic characters
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const fileUrl = `${this.config.get('S3_ENDPOINT')}/${this.bucketName}/${key}`;

      return {
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        key,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException({
        en: 'File upload failed',
        ar: 'فشل رفع الملف',
      });
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new BadRequestException({
        en: 'File deletion failed',
        ar: 'فشل حذف الملف',
      });
    }
  }

  /**
   * Get presigned URL for temporary file access
   * Useful for private files
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new BadRequestException({
        en: 'Failed to generate file URL',
        ar: 'فشل إنشاء رابط الملف',
      });
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    const maxSize = 100 * 1024 * 1024; // 100MB

    // Strip charset/boundary parameters (e.g. "text/plain; charset=utf-8" → "text/plain")
    const mimeType = file.mimetype?.split(';')[0].trim().toLowerCase() ?? '';

    const allowedMimeTypes = new Set([
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/csv',

      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',

      // Archives — browsers & OSes report different MIME types for the same format
      'application/zip',
      'application/x-zip',
      'application/x-zip-compressed',  // Windows ZIP
      'application/octet-stream',       // Generic binary (ZIP/7z/tar on some OSes)
      'application/x-rar-compressed',
      'application/x-rar',
      'application/vnd.rar',            // Modern RAR MIME
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-gzip',
      'application/x-tar',
      'application/x-bzip2',

      // Videos
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',

      // Code / markup
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/x-javascript',
      'application/json',
      'application/xml',
      'text/xml',
    ]);

    if (file.size > maxSize) {
      throw new BadRequestException({
        en: 'File size exceeds 100MB limit',
        ar: 'حجم الملف يتجاوز الحد الأقصى 100 ميجابايت',
      });
    }

    if (!allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException({
        en: `File type not allowed (${mimeType})`,
        ar: `نوع الملف غير مسموح (${mimeType})`,
      });
    }

    // Block executable extensions regardless of MIME type
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.app', '.msi', '.vbs', '.ps1'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (dangerousExtensions.includes(ext)) {
      throw new BadRequestException({
        en: 'Executable files are not allowed',
        ar: 'الملفات التنفيذية غير مسموح بها',
      });
    }
  }
}
