import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { access, rename } from 'fs'
import { promisify } from 'util'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'

const renameAsync = promisify(rename)
const accessAsync = promisify(access)

async function moveFile(imagePath: string, from: string, to: string) {
    const fileName = path.basename(imagePath)
    const imagePathTemp = path.join(from, fileName)
    const imagePathPermanent = path.join(to, fileName)
    
    // Проверяем, существует ли файл в temp
    try {
        await accessAsync(imagePathTemp)
    } catch {
        throw new Error('Ошибка при сохранении файла')
    }

    await renameAsync(imagePathTemp, imagePathPermanent)
}

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        // Перемещаем файл из temp в images
        await moveFile(
            req.file.filename,
            path.join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`),
            path.join(__dirname, `../public/${process.env.UPLOAD_PATH}`)
        )

        const fileName = `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default { uploadFile }
