import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'

const storage = multer.memoryStorage();

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedTypes = [
        'image/png',
        'image/jpg',
        'image/jpeg',
        'image/gif',
        'image/svg+xml',
        'image/webp',
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type'))
    }
}

export default multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
})
