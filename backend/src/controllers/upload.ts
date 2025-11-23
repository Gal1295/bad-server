import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import { fileTypeFromFile } from 'file-type'
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
    const file = (req as MulterRequest).file

    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'Файл не загружен',
        })
    }

    const { size, filename } = file
    const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
    const filePath = path.join(__dirname, '..', 'public', tempDir, filename)

    if (size < MIN_FILE_SIZE) {
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

        let fileType
        try {
            fileType = await fileTypeFromFile(filePath)
        } catch (e) {
            console.error('Ошибка при определении типа файла:', e)
            fs.unlink(filePath, () => {})
            return res.status(400).json({
                success: false,
                message: 'Невозможно определить тип файла',
            })
        }

        if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
            fs.unlink(filePath, () => {})
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
        const newFilePath = path.join(
            __dirname,
            '..',
            'public',
            tempDir,
            newFileName
        )
        fs.renameSync(filePath, newFilePath)

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${newFileName}`
            : `/${newFileName}`

        return res.status(constants.HTTP_STATUS_CREATED).json({
            success: true,
            fileName,
        })
    } catch (error) {
        console.error('Ошибка в uploadFile:', error)
        fs.unlink(filePath, () => {})
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        })
    }
}

export default {}
