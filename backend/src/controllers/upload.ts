import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'
import crypto from 'crypto'
import path from 'path'

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new BadRequestError('Файл не загружен'))
  }
  try {
    const fileExtension = path.extname(req.file.originalname)
    const randomFileName = crypto.randomBytes(16).toString('hex') + fileExtension
    
    const fileUrl = process.env.UPLOAD_PATH_TEMP
      ? `/${process.env.UPLOAD_PATH_TEMP}/${randomFileName}`
      : `/uploads/${randomFileName}`

    return res.status(constants.HTTP_STATUS_CREATED).json({
      fileName: fileUrl,
      originalName: req.file.originalname,
    })
  } catch (error) {
    next(error)
  }
}
