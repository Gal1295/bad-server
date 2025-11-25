import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'

const MIN_FILE_SIZE = 2 * 1024

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
        const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
        const filePath = path.join(__dirname, '..', 'public', tempDir, filename)
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.warn(`Не удалось удалить ${filePath}:`, err.message)
            }
        })

        return res.status(400).json({
            success: false,
            message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
        })
    }

    try {
        const allowedImageTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ]

        if (!allowedImageTypes.includes(mimetype)) {
            const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
            const filePath = path.join(__dirname, '..', 'public', tempDir, filename)
            fs.unlink(filePath, () => {})

            return res.status(400).json({
                success: false,
                message: 'Файл не является валидным изображением',
            })
        }
        const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
        const finalDir = process.env.UPLOAD_PATH || 'images'
        
        const tempPath = path.join(__dirname, '..', 'public', tempDir, filename)
        const finalPath = path.join(__dirname, '..', 'public', finalDir, filename)
        const finalDirPath = path.join(__dirname, '..', 'public', finalDir)
        if (!fs.existsSync(finalDirPath)) {
            fs.mkdirSync(finalDirPath, { recursive: true })
        }
        fs.renameSync(tempPath, finalPath)
        const fileName = `/${finalDir}/${filename}`
            
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
