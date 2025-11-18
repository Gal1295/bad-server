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
import auth from '../middlewares/auth'
import { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'

const orderRouter = Router()
orderRouter.get('/', auth, roleGuardMiddleware(Role.Admin), getOrders)
orderRouter.get('/current', auth, getOrdersCurrentUser)
orderRouter.get('/current/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.get(
    '/:orderNumber',
    auth,
    roleGuardMiddleware(Role.Admin),
    getOrderByNumber
)
orderRouter.post('/', auth, createOrder)
orderRouter.patch(
    '/:orderNumber',
    auth,
    roleGuardMiddleware(Role.Admin),
    updateOrder
)
orderRouter.delete('/:id', auth, roleGuardMiddleware(Role.Admin), deleteOrder)

export default orderRouter
