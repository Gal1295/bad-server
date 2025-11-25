import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import BadRequestError from '../errors/bad-request-error'

const MIN_FILE_SIZE = 2 * 1024 
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    const { size, filename, mimetype } = req.file
    if (size < MIN_FILE_SIZE) {
        const filePath = req.file.path;
        if (filePath) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Ошибка при удалении файла:', err);
            });
        }
        return res.status(400).json({
            success: false,
            message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
        });
    }

    if (size > MAX_FILE_SIZE) {
        const filePath = req.file.path;
        if (filePath) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Ошибка при удалении файла:', err);
            });
        }
        return res.status(400).json({
            success: false,
            message: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE} байт`,
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

    if (!allowedImageTypes.includes(mimetype)) {
        const filePath = req.file.path;
        if (filePath) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Ошибка при удалении файла:', err);
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Файл не является валидным изображением',
        });
    }

    try {
        const fileName = `/${process.env.UPLOAD_PATH || 'images'}/${filename}`

        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        const filePath = req.file.path;
        if (filePath) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Ошибка при удалении файла:', err);
            });
        }
        return next(error)
    }
}

export default { uploadFile }
