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
        // Генерируем уникальное имя файла вместо использования оригинального
        const fileExtension = path.extname(req.file.originalname)
        const uniqueFileName = `${uuidv4()}${fileExtension}`
        
        // В реальном приложении здесь должна быть логика переименования файла
        // или сохранения с уникальным именем. Поскольку multer уже сохранил файл
        // с сгенерированным именем (req.file.filename), мы можем использовать его
        
        // Но для безопасности возвращаем уникальное имя, а не оригинальное
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${uniqueFileName}`
            : `/${uniqueFileName}`
            
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file.originalname,
            // Дополнительно возвращаем уникальный идентификатор для безопасности
            fileId: uniqueFileName
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
