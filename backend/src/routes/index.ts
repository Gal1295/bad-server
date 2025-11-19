import { Router } from 'express'
import NotFoundError from '../errors/not-found-error'

import authRouter from './auth'
import customerRouter from './customers'
import orderRouter from './order'
import productRouter from './product'
import uploadRouter from './upload'
import auth from '../middlewares/auth'

const router = Router()

router.use('/auth', authRouter)
router.use('/product', productRouter)
router.use('/order', orderRouter)
router.use('/customers', customerRouter)
router.use('/upload', auth, uploadRouter)
router.use('*', () => {
  throw new NotFoundError('Маршрут не найден')
})

export default router