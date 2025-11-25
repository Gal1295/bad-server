import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
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
        // Просто возвращаем имя файла, но в images папке (как в других частях проекта)
        // Multer уже сохранил файл в temp с уникальным именем
        const fileName = `/images/${req.file.filename}`
        
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
