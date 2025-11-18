import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new BadRequestError('Файл не загружен'))
  }
  try {
    const ext = path.extname(req.file.originalname)
    const safeFilename = uuidv4() + ext

    const fileUrl = process.env.UPLOAD_PATH
      ? `/${process.env.UPLOAD_PATH}/${safeFilename}`
      : `/uploads/${safeFilename}`

    return res.status(constants.HTTP_STATUS_CREATED).json({
      fileName: fileUrl,
      originalName: req.file.originalname,
    })
  } catch (error) {
    next(error)
  }
}

export default {}
