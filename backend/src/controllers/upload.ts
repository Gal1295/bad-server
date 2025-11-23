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
    const tempPath = path.join(publicDir, tempDir, filename)
    try {
        await fs.promises.access(publicDir, fs.constants.F_OK)
    } catch (err) {
        console.error(`Директория public не существует: ${publicDir}`)
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        })
    }
    const fullTempDir = path.join(publicDir, tempDir)
    try {
        await fs.promises.mkdir(fullTempDir, { recursive: true })
    } catch (err) {
        console.error(`Не удалось создать директорию temp: ${fullTempDir}`, err)
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        })
    }

    if (size < MIN_FILE_SIZE) {
        try {
            await fs.promises.unlink(tempPath)
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.warn(
                    `Не удалось удалить ${tempPath} после проверки размера:`,
                    (err as Error).message
                )
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
            fileType = await fileTypeFromFile(tempPath)
        } catch (e) {
            console.error('Ошибка при определении типа файла:', e)
            try {
                await fs.promises.unlink(tempPath)
            } catch (unlinkErr) {
                if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.warn(
                        `Не удалось удалить ${tempPath} после ошибки fileType:`,
                        (unlinkErr as Error).message
                    )
                }
            }
            return res.status(400).json({
                success: false,
                message: 'Невозможно определить тип файла',
            })
        }

        if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
            try {
                await fs.promises.unlink(tempPath)
            } catch (unlinkErr) {
                if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.warn(
                        `Не удалось удалить ${tempPath} после проверки типа:`,
                        (unlinkErr as Error).message
                    )
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
        const finalDir = path.join(publicDir, UPLOAD_PATH)

        try {
            await fs.promises.mkdir(finalDir, { recursive: true })
        } catch (err) {
            console.error(
                `Не удалось создать директорию для финального файла: ${finalDir}`,
                err
            )
            try {
                await fs.promises.unlink(tempPath)
            } catch (unlinkErr) {
                if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.warn(
                        `Не удалось удалить временный файл ${tempPath}:`,
                        (unlinkErr as Error).message
                    )
                }
            }
            return res.status(500).json({
                success: false,
                message: 'Внутренняя ошибка сервера',
            })
        }

        const newFilePath = path.join(finalDir, newFileName)

        await fs.promises.rename(tempPath, newFilePath)
        const fileName = `/${UPLOAD_PATH}/${newFileName}`

        return res.status(constants.HTTP_STATUS_CREATED).json({
            success: true,
            fileName,
        })
    } catch (error) {
        console.error('Ошибка в uploadFile:', error)
        try {
            await fs.promises.unlink(tempPath)
        } catch (unlinkErr) {
            if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.warn(
                    `Не удалось удалить ${tempPath} после общей ошибки:`,
                    (unlinkErr as Error).message
                )
            }
        }
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
        })
    }
}

export default {}
