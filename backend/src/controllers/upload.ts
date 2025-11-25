import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null) || 
                 (req.files && typeof req.files === 'object' ? Object.values(req.files)[0] : null)

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
