import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

export const MIN_FILE_SIZE_BYTES = 1024;

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadPath = process.env.UPLOAD_PATH_TEMP
            ? join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`)
            : join(__dirname, '../public/uploads')
        cb(null, uploadPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const ext = extname(file.originalname).toLowerCase()
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('Недопустимое расширение файла'), '')
        }
        const safeName = uuidv4() + ext
        cb(null, safeName)
    },
})

const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

export default multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
})
