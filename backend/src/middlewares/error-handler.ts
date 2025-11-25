import { ErrorRequestHandler } from 'express'
import { CelebrateError } from 'celebrate'

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    // Логируем ошибку для отладки
    console.error('Error:', err.message, err.stack)

    // Обработка ошибок celebrate (валидация)
    if (err instanceof CelebrateError) {
        const errorMessage = err.details.get('body')?.message 
            || err.details.get('query')?.message 
            || err.details.get('params')?.message 
            || 'Ошибка валидации'
        
        return res.status(400).send({ message: errorMessage })
    }

    const statusCode = err.statusCode || 500
    const message = statusCode === 500 
        ? 'На сервере произошла ошибка' 
        : err.message

    res.status(statusCode).send({ message })

    next()
}

export default errorHandler
