import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'
import movingFile from '../utils/movingFile'

const MIN_FILE_SIZE = 2 * 1024

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    const { size, filename } = req.file

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
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ]

        if (!allowedImageTypes.includes(req.file.mimetype)) {
            const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
            const filePath = path.join(__dirname, '..', 'public', tempDir, filename)
            fs.unlink(filePath, () => {})

            return res.status(400).json({
                success: false,
                message: 'Файл не является валидным изображением',
            })
        }
        if (req.file) {
            movingFile(
                req.file.filename,
                path.join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`),
                path.join(__dirname, `../public/${process.env.UPLOAD_PATH}`)
            )
        }

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${filename}`
            : `/${filename}`
            
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
