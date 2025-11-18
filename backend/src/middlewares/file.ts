import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadPath = process.env.UPLOAD_PATH_TEMP
            ? join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`)
            : join(__dirname, '../public')

        cb(null, uploadPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const ext = file.originalname.slice(file.originalname.lastIndexOf('.'))
        const safeName = uuidv4() + ext
        cb(null, safeName)
    },
})

const types = [
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
    if (types.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
})

export default upload
