import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new BadRequestError('Файл не загружен'))
  }
  try {
    const fileUrl = process.env.UPLOAD_PATH_TEMP
      ? `/${process.env.UPLOAD_PATH_TEMP}/${req.file.filename}`
      : `/uploads/${req.file.filename}`

    return res.status(constants.HTTP_STATUS_CREATED).json({
      fileName: fileUrl,
      originalName: req.file.originalname,
    })
  } catch (error) {
    next(error)
  }
}
