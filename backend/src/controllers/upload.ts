import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import { fileTypeFromFile } from 'file-type'
import BadRequestError from '../errors/bad-request-error'
import { UPLOAD_PATH, UPLOAD_PATH_TEMP } from '../config'

interface MulterRequest extends Request {
    file: Express.Multer.File
}

const MIN_FILE_SIZE = 2 * 1024

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const file = (req as MulterRequest).file

    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'Файл не загружен',
        })
    }

    const { size, filename } = file
    const tempDir = UPLOAD_PATH_TEMP
    const publicDir = path.join(__dirname, '..', 'public')
    const tempPath = path.join(publicDir, tempDir)
    try {
        await fs.promises.access(publicDir, fs.constants.F_OK);
    } catch (err) {
        console.error(`Директория public не существует: ${publicDir}`);
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        });
    }

    try {
        await fs.promises.mkdir(tempPath, { recursive: true });
    } catch (err) {
        console.error(`Не удалось создать директорию temp: ${tempPath}`, err);
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        });
    }

    const filePath = path.join(tempPath, filename)

    if (size < MIN_FILE_SIZE) {
        try {
            await fs.promises.unlink(filePath);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                 console.warn(`Не удалось удалить ${filePath} после проверки размера:`, (err as Error).message);
            }
        }
        return res.status(400).json({
            success: false,
            message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
        })
    }

    try {
        const allowedImageTypes = [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ]

        let fileType
        try {
            fileType = await fileTypeFromFile(filePath)
        } catch (e) {
            console.error('Ошибка при определении типа файла:', e)
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkErr) {
                if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                     console.warn(`Не удалось удалить ${filePath} после ошибки fileType:`, (unlinkErr as Error).message);
                }
            }
            return res.status(400).json({
                success: false,
                message: 'Невозможно определить тип файла',
            })
        }

        if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkErr) {
                if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                     console.warn(`Не удалось удалить ${filePath} после проверки типа:`, (unlinkErr as Error).message);
                }
            }
            return res.status(400).json({
                success: false,
                message: 'Файл не является валидным изображением',
            })
        }

        const crypto = require('crypto')
        const randomName = crypto.randomBytes(16).toString('hex')
        const mimeToExt: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
        }

        const ext = mimeToExt[fileType.mime] || '.bin'
        const newFileName = randomName + ext
        const newFilePath = path.join(publicDir, UPLOAD_PATH, newFileName)
        const finalDir = path.dirname(newFilePath);
        try {
             await fs.promises.mkdir(finalDir, { recursive: true });
        } catch (err) {
            console.error(`Не удалось создать директорию для финального файла: ${finalDir}`, err);
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkErr) {
                if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                     console.warn(`Не удалось удалить временный файл ${filePath}:`, (unlinkErr as Error).message);
                }
            }
            return res.status(500).json({
                success: false,
                message: 'Внутренняя ошибка сервера',
            });
        }

        await fs.promises.rename(filePath, newFilePath) // Используем асинхронный rename

        const fileName = `/${UPLOAD_PATH}/${newFileName}` // Формируем путь для ответа

        return res.status(constants.HTTP_STATUS_CREATED).json({
            success: true,
            fileName,
        })
    } catch (error) {
        console.error('Ошибка в uploadFile:', error)
        try {
            await fs.promises.unlink(filePath);
        } catch (unlinkErr) {
            if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                 console.warn(`Не удалось удалить ${filePath} после общей ошибки:`, (unlinkErr as Error).message);
            }
        }
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        })
    }
}

export default {}
