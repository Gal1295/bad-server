import { Router } from 'express'
import {
  createOrder,
  getOrdersCurrentUser,
  getOrderCurrentUserByNumber,
  getOrders,
  getOrderByNumber,
  updateOrder,
  deleteOrder,
} from '../controllers/order'
import { adminGuard } from '../middlewares/auth'

const orderRouter = Router()

orderRouter.post('/', createOrder) 
orderRouter.get('/current', getOrdersCurrentUser)
orderRouter.get('/current/:orderNumber', getOrderCurrentUserByNumber)
orderRouter.get('/', adminGuard, getOrders)
orderRouter.get('/:orderNumber', adminGuard, getOrderByNumber)
orderRouter.patch('/:orderNumber', adminGuard, updateOrder)
orderRouter.delete('/:id', adminGuard, deleteOrder)

export default orderRouter
