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
import adminGuard from '../middlewares/admin-guard'

const orderRouter = Router()

orderRouter.post('/', auth, createOrder)
orderRouter.get('/current', auth, getOrdersCurrentUser)
orderRouter.get('/current/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.get('/', auth, adminGuard, getOrders)
orderRouter.get('/:orderNumber', auth, adminGuard, getOrderByNumber)
orderRouter.patch('/:orderNumber', auth, adminGuard, updateOrder)
orderRouter.delete('/:id', auth, adminGuard, deleteOrder)

export default orderRouter
