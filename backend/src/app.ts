import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import fs from 'fs' // ✅ ДОБАВИТЬ
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

console.log('🚀 Backend application starting...'); // ✅ ДОБАВИТЬ

// ✅ ДОБАВИТЬ: Создаем необходимые директории
const publicDir = path.join(__dirname, 'public');
const imagesDir = path.join(publicDir, 'images');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Created public directory');
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ Created images directory');
}

app.set('trust proxy', 1)

app.use(
    rateLimit({
        windowMs: 1 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
    })
)

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

// ✅ ДОБАВИТЬ: Логирование всех запросов
app.use((req, res, next) => {
    console.log('📨 BACKEND REQUEST:', req.method, req.url);
    console.log('📨 Query:', req.query);
    console.log('📨 Headers authorization:', req.headers.authorization ? 'present' : 'missing');
    next();
});

app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        console.log('✅ Connected to MongoDB'); // ✅ ДОБАВИТЬ
        app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`)) // ✅ ИСПРАВИТЬ
    } catch (err) {
        console.error('❌ Failed to start server:', err) // ✅ УЛУЧШИТЬ
    }
}

bootstrap()
