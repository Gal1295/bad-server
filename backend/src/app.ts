import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import { DB_ADDRESS, CSRF_COOKIE } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = '3000' } = process.env
const app = express()

console.log('🚀 Backend application starting...');

// ✅ Rate limiting
app.use(
    rateLimit({
        windowMs: 1 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
    })
)

// ✅ CORS
app.use(
    cors({
        origin: process.env.ORIGIN_ALLOW || 'http://localhost:5173',
        credentials: true,
    })
)

app.use(cookieParser())
app.use(serveStatic(path.join(__dirname, 'public')))
app.use(urlencoded({ extended: true }))
app.use(json({ limit: '10mb' }))

// ✅ Логирование всех запросов
app.use((req, res, next) => {
    console.log('📨 BACKEND REQUEST:', req.method, req.url);
    console.log('📨 Query:', req.query);
    console.log('📨 Headers authorization:', req.headers.authorization ? 'present' : 'missing');
    next();
});

// ✅ Основные роуты
app.use(routes)

// ✅ Обработка ошибок
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        console.log('✅ Connected to MongoDB');
        
        // ✅ Преобразуем PORT в число
        const port = parseInt(PORT, 10);
        app.listen(port, '0.0.0.0', () => {
            console.log('✅ Backend server is running on port', port);
            console.log('🌐 Direct URL: http://localhost:' + port);
            console.log('🔗 Through nginx: http://localhost/api');
            console.log('🔗 Internal URL: http://backend:' + port);
        })
    } catch (err) {
        console.error('❌ Failed to start server:', err)
    }
}

bootstrap()
