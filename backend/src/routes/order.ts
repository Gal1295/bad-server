import { Router } from 'express'
import { 
    getOrders, 
    getOrdersCurrentUser, 
    getOrderByNumber, 
    getOrderCurrentUserByNumber, 
    createOrder, 
    updateOrder, 
    deleteOrder 
} from '../controllers/order'

const router = Router()

// Теперь эти пути будут доступны по /orders/*
router.get('/', getOrders)  // GET /orders
router.get('/my', getOrdersCurrentUser)  // GET /orders/my
router.get('/:orderNumber', getOrderByNumber)  // GET /orders/123
router.get('/my/:orderNumber', getOrderCurrentUserByNumber)  // GET /orders/my/123
router.post('/', createOrder)  // POST /orders
router.patch('/:orderNumber', updateOrder)  // PATCH /orders/123
router.delete('/:orderNumber', deleteOrder)  // DELETE /orders/123

export default router
