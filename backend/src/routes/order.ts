import { Router } from 'express'
import {
  getOrders,
  getOrdersCurrentUser,
  getOrderByNumber,
  getOrderCurrentUserByNumber,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/order'
import auth from '../middlewares/auth'
import adminGuard from '../middlewares/admin-guard'

const orderRouter = Router()

orderRouter.get('/', auth, adminGuard, getOrders)
orderRouter.get('/current', auth, getOrdersCurrentUser)
orderRouter.get('/:orderNumber', auth, adminGuard, getOrderByNumber)
orderRouter.get('/current/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.post('/', auth, createOrder)
orderRouter.patch('/:orderNumber', auth, adminGuard, updateOrder)
orderRouter.delete('/:id', auth, adminGuard, deleteOrder)

export default orderRouter
