import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import { handleMulterError } from './middlewares/file'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

// Rate limiting - более строгие настройки
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // лимит запросов
    message: { 
        error: 'Слишком много запросов с этого IP, попробуйте позже' 
    },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(limiter)

app.use(cookieParser())

// УЛУЧШЕННЫЕ CORS настройки
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Security headers middleware
app.use((_req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff')
    res.header('X-Frame-Options', 'DENY')
    res.header('X-XSS-Protection', '1; mode=block')
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    next()
})

app.use(serveStatic(path.join(__dirname, 'public')))

// Body size limit
app.use(urlencoded({ extended: true, limit: '10mb' }))
app.use(json({ limit: '10mb' }))

app.options('*', cors())
app.use(routes)
app.use(handleMulterError) // добавляем обработчик ошибок multer
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
    } catch (error) {
        console.error('Failed to start server:', error)
    }
}

bootstrap()
