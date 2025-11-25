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
        const fileName = `/${req.file.filename}`
            
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            fileId: req.file.filename
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
