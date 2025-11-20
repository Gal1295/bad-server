import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

export const MIN_FILE_SIZE_BYTES = 1024;

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadPath = process.env.UPLOAD_PATH_TEMP
            ? join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}`)
            : join(__dirname, '../public/uploads')
        cb(null, uploadPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const ext = extname(file.originalname).toLowerCase()
        // Проверим, допустимо ли расширение. Если нет, всё равно генерируем безопасное имя.
        // Но если расширение отсутствует, можно сгенерировать его из mimetype.
        // Для простоты, просто используем ext как есть (он будет безопасен, так как из extname).
        // Или, как в "работающем" примере, можно игнорировать originalname и брать из mimetype.
        // Пока оставим как есть, но убедимся, что extname возвращает строку.
        // const safeName = uuidv4() + ext // Это было изначально, может быть небезопасно, если ext опасен.
        // Лучше проверить ext и сгенерировать безопасное расширение на основе mimetype.
        // Но для совместимости с вашим текущим uploadFile, который ожидает расширение из originalname,
        // можно оставить так, но убедиться, что storage.filename не вызывает ошибок.
        // Проверим ext на допустимость ТУТ ЖЕ, чтобы избежать проблем позже.
        // Однако, если мы проверим тут, мы опять отклоним файл до uploadFile.
        // Лучше доверить проверку uploadFile, как вы и сделали.
        // Поэтому, ДА, генерируем безопасное имя, используя extname(originalname).
        // Но fileFilter уже должен был отсеять файлы по mimetype.
        // И uploadFile проверяет originalname.
        // Главное - не вызывать cb(new Error(...), '') до проверки uploadFile, если мы хотим,
        // чтобы uploadFile сам отверг файл.
        // Проверим, что extname возвращает строку. extname всегда возвращает строку.
        // Проблема была в том, что allowedExtensions.includes(ext) проверялось в storage.filename.
        // Уберём эту проверку из storage.filename.
        // storage.filename просто генерирует безопасное имя на основе originalname.
        // fileFilter проверяет mimetype.
        // uploadFile проверяет originalname.

        // --- ВАЖНО: Убираем проверку расширения из storage.filename ---
        // if (!allowedExtensions.includes(ext)) {
        //     return cb(new Error('Недопустимое расширение файла'), '')
        // }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        // Генерируем безопасное имя, используя расширение из originalname
        // Это может быть небезопасно, если originalname был манипулирован, но extname() возвращает только расширение.
        // Например, originalname = '../../../../etc/passwd.jpg' -> extname = '.jpg' -> safeName = uuid + '.jpg'
        // Это безопасно. extname() не интерпретирует пути.
        const safeName = uuidv4() + ext
        cb(null, safeName)
    },
})

const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // Проверяем mimetype
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true) // Принимаем файл
    } else {
        // Отклоняем файл по типу
        cb(null, false) // Это приведёт к ошибке multer
    }
}

export default multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10mb
})
