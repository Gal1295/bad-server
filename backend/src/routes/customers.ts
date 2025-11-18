import { Router } from 'express'
import {
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from '../controllers/customers'
import auth from '../middlewares/auth'
import { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'

const customerRouter = Router()
customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), getCustomers) // ← ТЕСТ №9 и №10
customerRouter.get(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    getCustomerById
)
customerRouter.patch(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    updateCustomer
)
customerRouter.delete(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    deleteCustomer
)

export default customerRouter
