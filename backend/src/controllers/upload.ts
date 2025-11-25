import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'
import movingFile from '../utils/movingFile'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        await movingFile(
            req.file.filename,
            path.join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`),
            path.join(__dirname, `../public/${process.env.UPLOAD_PATH}`)
        )

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file.filename}`
            
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
