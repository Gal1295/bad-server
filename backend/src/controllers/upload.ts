import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import { fileTypeFromFile } from 'file-type'
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

    const { size, filename, path: filePath } = req.file
    if (size < MIN_FILE_SIZE) {
        if (filePath) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr)
                    console.error('Ошибка при удалении файла:', unlinkErr)
            })
        }
        return res.status(400).json({
            success: false,
            message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
        })
    }

    if (size > MAX_FILE_SIZE) {
        if (filePath) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr)
                    console.error('Ошибка при удалении файла:', unlinkErr)
            })
        }
        return res.status(400).json({
            success: false,
            message: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE} байт`,
        })
    }
    const allowedImageTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ]

    const mimeType = req.file.mimetype
    if (!mimeType || !allowedImageTypes.includes(mimeType)) {
        if (filePath) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr)
                    console.error('Ошибка при удалении файла:', unlinkErr)
            })
        }
        return res.status(400).json({
            success: false,
            message: 'Файл не является валидным изображением (mimetype).',
        })
    }
    try {
        const detectedType = await fileTypeFromFile(filePath)
        if (!detectedType) {
            if (filePath) {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr)
                        console.error('Ошибка при удалении файла:', unlinkErr)
                })
            }
            return res.status(400).json({
                success: false,
                message:
                    'Файл не является валидным изображением (неопознанный тип).',
            })
        }
        if (!allowedImageTypes.includes(detectedType.mime)) {
            if (filePath) {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr)
                        console.error('Ошибка при удалении файла:', unlinkErr)
                })
            }
            return res.status(400).json({
                success: false,
                message: `Файл не является валидным изображением (недопустимый тип: ${detectedType.mime}).`,
            })
        }
    } catch (err) {
        console.error('Ошибка при определении типа файла:', err)
        if (filePath) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr)
                    console.error('Ошибка при удалении файла:', unlinkErr)
            })
        }
        return res.status(500).json({
            success: false,
            message: 'Ошибка при проверке файла.',
        })
    }

    try {
        const fileName = `/${process.env.UPLOAD_PATH || 'images'}/${filename}`

        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        if (filePath) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr)
                    console.error('Ошибка при удалении файла:', unlinkErr)
            })
        }
        return next(error)
    }
}

export default { uploadFile }
