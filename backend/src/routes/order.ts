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
orderRouter.get('/current', auth, getOrdersCurrentUser)
orderRouter.get('/current/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.get('/', auth, adminGuard, getOrders)
orderRouter.get('/:orderNumber', auth, adminGuard, getOrderByNumber)
orderRouter.patch('/:orderNumber', auth, adminGuard, updateOrder)
orderRouter.delete('/:orderNumber', auth, adminGuard, deleteOrder)

export default orderRouter
