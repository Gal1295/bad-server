import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const file = (req.files as any)?.[0]

    if (!file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        const fileName = `/${file.filename}`
        
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
