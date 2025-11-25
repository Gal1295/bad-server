import { existsSync, rename } from 'fs'
import { promisify } from 'util'
import { basename, join } from 'path'

const renameAsync = promisify(rename)

async function movingFile(imagePath: string, from: string, to: string) {
    const fileName = basename(imagePath)
    const imagePathTemp = join(from, fileName)
    const imagePathPermanent = join(to, fileName)  
    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла')
    }

    await renameAsync(imagePathTemp, imagePathPermanent)
}

export default movingFile
