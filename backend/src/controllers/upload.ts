import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        if (req.file.size < 2048) {
            throw new BadRequestError('Размер файла должен быть не менее 2KB')
        }

        const allowedImageTypes = [
            'image/png',
            'image/jpeg', 
            'image/jpg',
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ]

        if (!allowedImageTypes.includes(req.file.mimetype)) {
            throw new BadRequestError('Файл не является валидным изображением')
        }
        const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
        const finalDir = process.env.UPLOAD_PATH || 'images'
        
        const tempPath = path.join(__dirname, '..', 'public', tempDir, req.file.filename)
        const finalPath = path.join(__dirname, '..', 'public', finalDir, req.file.filename)
        const finalDirPath = path.join(__dirname, '..', 'public', finalDir)
        
        if (!fs.existsSync(finalDirPath)) {
            fs.mkdirSync(finalDirPath, { recursive: true })
        }
        
        fs.renameSync(tempPath, finalPath)
        const fileName = `/${finalDir}/${req.file.filename}`

        if (fileName.includes('..') || fileName.includes('//')) {
            throw new BadRequestError('Некорректный путь к файлу')
        }
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (err) {
                console.error('Ошибка удаления файла:', err)
            }
        }

        if (error instanceof BadRequestError) {
            return next(error)
        }

        return next(
            new BadRequestError(
                error instanceof Error ? error.message : 'Ошибка загрузки файла'
            )
        )
    }
}

export default { uploadFile }
