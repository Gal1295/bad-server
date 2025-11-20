import { existsSync, rename } from 'fs'
import { promisify } from 'util'
import { basename, join } from 'path'
import BadRequestError from '../errors/bad-request-error'

const renameAsync = promisify(rename);
async function movingFile(imagePath: string, from: string, to: string) {
    const fileName = basename(imagePath)
    if (fileName.includes('..') || fileName.includes('/')) {
        throw new BadRequestError('Недопустимое имя файла')
    }

    const imagePathTemp = join(from, fileName)
    const imagePathPermanent = join(to, fileName)
    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла: исходный файл не найден')
    }

    try {
        await renameAsync(imagePathTemp, imagePathPermanent)
    } catch (err) {
        throw new Error('Ошибка при сохранении файла: ' + (err instanceof Error ? err.message : 'неизвестная ошибка'))
    }
}

export default movingFile
