import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import crypto from 'crypto'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'

interface MulterRequest extends Request {
  file: Express.Multer.File
}

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = (req as MulterRequest).file

  if (!file) {
    return next(new BadRequestError('Файл не загружен'))
  }

  try {
    const ext = path.extname(file.originalname).toLowerCase()

    const randomName = crypto.randomBytes(16).toString('hex')
    const newFileName = randomName + ext

    const fileUrl = process.env.UPLOAD_PATH_TEMP
      ? `/${process.env.UPLOAD_PATH_TEMP}/${newFileName}`
      : `/uploads/${newFileName}`

    return res.status(constants.HTTP_STATUS_CREATED).json({
      fileName: fileUrl,
    })
  } catch (error) {
    next(error)
  }
}
