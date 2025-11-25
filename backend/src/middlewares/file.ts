import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'
import crypto from 'crypto'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadDir = join(
            __dirname,
            process.env.UPLOAD_PATH_TEMP
                ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                : '../public'
        )
        
        cb(null, uploadDir)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        // Генерируем безопасное имя файла без оригинального имени
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || ''
        const uniqueId = crypto.randomBytes(16).toString('hex')
        const uniqueFileName = `${uniqueId}.${fileExtension}`
        cb(null, uniqueFileName)
    },
})

// Разрешенные MIME типы
const allowedMimeTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'image/webp'
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // Проверяем MIME тип
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Недопустимый тип файла. Разрешены только изображения.'))
    }

    // Дополнительная проверка расширения
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return cb(new Error('Недопустимое расширение файла'))
    }

    return cb(null, true)
}

// Обработчик ошибок multer
export const handleMulterError = (err: any, _req: Request, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Файл слишком большой' })
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Слишком много файлов' })
        }
    } else if (err) {
        return res.status(400).json({ message: err.message })
    }
    next(err)
}

export default multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    }
})
