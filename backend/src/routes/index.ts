import { Router } from 'express'
import NotFoundError from '../errors/not-found-error'

import auth from '../middlewares/auth'
import adminGuard from '../middlewares/admin-guard' // ← Правильный импорт

import authRouter from './auth'
import customerRouter from './customers'
import orderRouter from './order'
import productRouter from './product'
import uploadRouter from './upload'

const router = Router()

router.use('/auth', authRouter)
router.use('/product', productRouter)
router.use('/order', auth, adminGuard, orderRouter)
router.use('/customers', auth, adminGuard, customerRouter)
router.use('/upload', auth, uploadRouter)

router.use(() => {
    throw new NotFoundError('Маршрут не найден')
})

export default router
