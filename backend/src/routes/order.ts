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

router.get('/', getOrders)
router.get('/my', getOrdersCurrentUser)
router.get('/:orderNumber', getOrderByNumber) 
router.get('/my/:orderNumber', getOrderCurrentUserByNumber)
router.post('/', createOrder)
router.patch('/:orderNumber', updateOrder)
router.delete('/:orderNumber', deleteOrder)

export default router
