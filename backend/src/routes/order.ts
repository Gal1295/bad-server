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

// ✅ Убедимся что все роуты определены
router.get('/', getOrders)  // GET /order
router.get('/my', getOrdersCurrentUser)  // GET /order/my
router.get('/:orderNumber', getOrderByNumber)  // GET /order/123
router.get('/my/:orderNumber', getOrderCurrentUserByNumber)  // GET /order/my/123
router.post('/', createOrder)  // POST /order
router.patch('/:orderNumber', updateOrder)  // PATCH /order/123
router.delete('/:orderNumber', deleteOrder)  // DELETE /order/123

export default router
