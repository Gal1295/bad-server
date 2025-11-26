import { Router } from 'express'
import {
    createOrder,
    deleteOrder,
    getOrderByNumber,
    getOrderCurrentUserByNumber,
    getOrders,
    getOrdersCurrentUser,
    updateOrder,
} from '../controllers/order'
import auth, { adminGuard } from '../middlewares/auth'
import { validateOrderBody } from '../middlewares/validations'

const orderRouter = Router()

orderRouter.post('/', auth, validateOrderBody, createOrder)
orderRouter.get('/all', auth, adminGuard, getOrders)
orderRouter.get('/all/me', auth, getOrdersCurrentUser)
orderRouter.get('/:orderNumber', auth, getOrderByNumber)
orderRouter.get('/me/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.patch('/:orderNumber', auth, adminGuard, updateOrder)

orderRouter.delete('/:id', auth, adminGuard, deleteOrder)

export default orderRouter
