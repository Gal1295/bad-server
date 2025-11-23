import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

interface MulterRequest extends Request {
  file: Express.Multer.File
}

const MIN_FILE_SIZE = 2 * 1024

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🎯 UPLOAD CONTROLLER - START');
    
    const file = (req as MulterRequest).file;
    console.log('🎯 File object received:', !!file);
    
    if (file) {
      console.log('🎯 File details:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        destination: file.destination,
        filename: file.filename,
        path: file.path,
        buffer: file.buffer ? `Buffer ${file.buffer.length} bytes` : 'No buffer'
      });
    }

    if (!file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен',
      });
    }

    const { size, mimetype, path: filePath } = file;

    console.log('🎯 Checking file size:', size, 'MIN:', MIN_FILE_SIZE);
    if (size < MIN_FILE_SIZE) {
      console.log('❌ File too small');
      return res.status(400).json({
        success: false,
        message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
      });
    }

    const allowedImageTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    console.log('🎯 Checking mimetype:', mimetype);
    console.log('🎯 Allowed types:', allowedImageTypes);

    if (!allowedImageTypes.includes(mimetype)) {
      console.log('❌ Invalid file type');
      return res.status(400).json({
        success: false,
        message: 'Файл не является валидным изображением',
      });
    }

    // Check if file actually exists on disk
    if (filePath) {
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        console.log('✅ File exists on disk:', filePath);
      } catch (accessError) {
        console.error('❌ File does not exist on disk:', filePath);
        return res.status(500).json({
          success: false,
          message: 'Загруженный файл не найден на сервере',
        });
      }
    }

    // Генерируем случайное имя
    const randomName = crypto.randomBytes(16).toString('hex');
    
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    
    const ext = mimeToExt[mimetype] || '.bin';
    const newFileName = randomName + ext;
    const fileName = `/uploads/${newFileName}`;

    console.log('✅ Generated filename:', fileName);
    
    return res.status(201).json({
      success: true,
      fileName,
    });
  } catch (error: unknown) {
    console.error('❌ UPLOAD ERROR:', error);
    
    if (error instanceof Error) {
      console.error('❌ Error stack:', error.stack);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке файла',
    });
  }
};

export default uploadFile;
