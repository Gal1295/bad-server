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
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('🎯 UPLOAD CONTROLLER - START');
        
        const file = (req as MulterRequest).file;
        console.log('🎯 File object received:', !!file);

        if (!file) {
            console.log('❌ No file in request');
            return res.status(400).json({
                success: false,
                message: 'Файл не загружен',
            })
        }

        const { size, mimetype, buffer, originalname } = file;

        console.log('🎯 Checking file size:', size, 'MIN:', MIN_FILE_SIZE, 'MAX:', MAX_FILE_SIZE);

        // Проверка размера файла
        if (size < MIN_FILE_SIZE) {
            console.log('❌ File too small');
            return res.status(400).json({
                success: false,
                message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
            })
        }

        if (size > MAX_FILE_SIZE) {
            console.log('❌ File too large');
            return res.status(400).json({
                success: false,
                message: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE} байт`,
            })
        }

        // Проверка типа файла
        const allowedImageTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ]

        console.log('🎯 Checking mimetype:', mimetype);
        
        if (!allowedImageTypes.includes(mimetype)) {
            console.log('❌ Invalid file type');
            return res.status(400).json({
                success: false,
                message: 'Файл не является валидным изображением',
            })
        }

        // Проверка buffer (memory storage)
        if (!buffer || buffer.length === 0) {
            console.log('❌ File buffer is empty');
            return res.status(400).json({
                success: false,
                message: 'Файл пустой или поврежден',
            })
        }

        // ✅ Генерируем СЛУЧАЙНОЕ имя - НЕ ИСПОЛЬЗУЕМ ОРИГИНАЛЬНОЕ ИМЯ
        const randomName = crypto.randomBytes(16).toString('hex');
        
        const mimeToExt: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
        }

        const ext = mimeToExt[mimetype] || '.bin'
        const newFileName = randomName + ext // ✅ Только случайное имя
        const fileName = `/images/${newFileName}` // ✅ Сохраняем в images

        console.log('✅ Generated random filename:', newFileName);
        console.log('✅ Original filename was:', originalname);

        // Сохраняем файл из buffer на диск
        const imagesDir = path.join(__dirname, '../public/images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        const filePath = path.join(imagesDir, newFileName);
        fs.writeFileSync(filePath, buffer);
        
        console.log('✅ File saved successfully:', filePath);

        return res.status(constants.HTTP_STATUS_CREATED).json({
            success: true,
            fileName, // ✅ Возвращаем только случайное имя
        })
    } catch (error) {
        console.error('❌ UPLOAD ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Ошибка при загрузке файла',
        })
    }
}

export default uploadFile
