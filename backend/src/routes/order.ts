// routes/order.ts
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
import { adminGuard } from '../middlewares/auth';

const router = Router()

router.get('/', adminGuard, getOrders)
router.get('/my', getOrdersCurrentUser)
router.get('/:orderNumber', getOrderByNumber) 
router.get('/my/:orderNumber', getOrderCurrentUserByNumber)
router.post('/', createOrder)
router.patch('/:orderNumber', updateOrder)
router.delete('/:orderNumber', deleteOrder)

export default router
