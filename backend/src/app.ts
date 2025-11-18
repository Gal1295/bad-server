import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 100,
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
app.use(json())
app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        app.listen(PORT, () => console.log('ok'))
    } catch (err) {
        console.error(err)
    }
}

bootstrap()
