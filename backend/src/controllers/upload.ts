import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import fs from 'fs'
import path from 'path'
import { fileTypeFromFile } from 'file-type'
import BadRequestError from '../errors/bad-request-error'

interface MulterRequest extends Request {
  file: Express.Multer.File
}

const MIN_FILE_SIZE = 2 * 1024

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = (req as MulterRequest).file

  if (!file) {
    return next(new BadRequestError('Файл не загружен'))
  }

  const { size, filename } = file

  if (size < MIN_FILE_SIZE) {
    const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
    const filePath = path.join(__dirname, '..', 'public', tempDir, filename)
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.warn(`Не удалось удалить ${filePath}:`, err.message)
      }
    })
    return res.status(400).json({
      success: false,
      message: `Файл слишком маленький. Минимальный размер: ${MIN_FILE_SIZE} байт`,
    })
  }

  try {
    const allowedImageTypes = [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]

    const tempDir = process.env.UPLOAD_PATH_TEMP || 'temp'
    const filePath = path.join(__dirname, '..', 'public', tempDir, filename)

    let fileType;
    try {
      fileType = await fileTypeFromFile(filePath)
    } catch (e) {
      console.error('Ошибка при определении типа файла:', e)
      fs.unlink(filePath, () => {})
      return next(new BadRequestError('Невозможно определить тип файла'))
    }

    if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
      fs.unlink(filePath, () => {})
      return res.status(400).json({
        success: false,
        message: 'Файл не является валидным изображением',
      })
    }

    const fileName = process.env.UPLOAD_PATH
      ? `/${process.env.UPLOAD_PATH}/${file.filename}`
      : `/${file.filename}`

    return res.status(constants.HTTP_STATUS_CREATED).json({
      fileName,
    })
  } catch (error) {
    console.error('Ошибка в uploadFile:', error)
    return next(error)
  }
}

export default {}
