import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import BadRequestError from '../errors/bad-request-error'

interface MulterRequest extends Request {
  file: Express.Multer.File
}

const MIN_FILE_SIZE = 2 * 1024

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('=== UPLOAD FILE CALLED ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers authorization:', req.headers.authorization ? 'present' : 'missing');
  console.log('User from auth:', res.locals.user ? 'authenticated' : 'not authenticated');
  
  const file = (req as MulterRequest).file;
  console.log('📁 File received:', file ? {
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
  } : '❌ NO FILE');

  if (!file) {
    console.log('❌ No file - returning error');
    return res.status(400).json({
      success: false,
      message: 'Файл не загружен',
    });
  }

  const { size, path: filePath, mimetype } = file;

  if (size < MIN_FILE_SIZE) {
    console.log('❌ File too small');
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.warn(`Не удалось удалить ${filePath}:`, err.message);
      }
    });
    return res.status(400).json({
      success: false,
      message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
    });
  }

  const allowedImageTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (!allowedImageTypes.includes(mimetype)) {
    console.log('❌ Invalid file type:', mimetype);
    fs.unlink(filePath, () => {});
    return res.status(400).json({
      success: false,
      message: 'Файл не является валидным изображением',
    });
  }

  // ✅ Генерируем случайное имя вместо использования оригинального
  const randomName = crypto.randomBytes(16).toString('hex');
  
  // Определяем расширение из MIME-типа
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

  // Переименовываем файл
  const newFilePath = path.join(path.dirname(filePath), newFileName);
  fs.renameSync(filePath, newFilePath);

  const fileName = process.env.UPLOAD_PATH
    ? `/${process.env.UPLOAD_PATH}/${newFileName}`
    : `/${newFileName}`;

  console.log('✅ Generated filename:', fileName);
  console.log('✅ Sending success response');
  
  return res.status(constants.HTTP_STATUS_CREATED).json({
    success: true,
    fileName,
  });
};

export default uploadFile;
