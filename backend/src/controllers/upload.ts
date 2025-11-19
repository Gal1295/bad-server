import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'
import crypto from 'crypto'
import path from 'path'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        const ext = path.extname(req.file.originalname)
        const fileName = crypto.randomBytes(16).toString('hex') + ext
        const fileUrl = `/uploads/${fileName}`

        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName: fileUrl
        })
    } catch (error) {
        next(error)
    }
}
