import { Router } from 'express'
import authRouter from './auth'
import customerRouter from './customers'
import orderRouter from './order'
import productRouter from './product'
import uploadRouter from './upload'
import auth from '../middlewares/auth'
import NotFoundError from '../errors/not-found-error'

const router = Router()

router.use('/auth', authRouter)
router.use('/product', productRouter)
router.use('/order', auth, orderRouter)
router.use('/customers', auth, customerRouter)
router.use('/upload', auth, uploadRouter)
router.use((req, res, next) => {
  next(new NotFoundError('Маршрут не найден'))
})

export default router
