import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
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
        const fileExtension = path.extname(req.file.originalname)
        const uniqueFileName = `${uuidv4()}${fileExtension}`
        
        // ВАЖНО: возвращаем JSON с правильной структурой
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName: uniqueFileName, // Возвращаем только сгенерированное имя
            fileId: uniqueFileName,
            success: true,
            message: 'Файл успешно загружен'
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
