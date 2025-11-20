import { Router } from 'express'
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customers'
import auth, { adminGuard } from '../middlewares/auth'

const customerRouter = Router()

customerRouter.get('/', auth, adminGuard, getCustomers)
customerRouter.get('/:id', auth, adminGuard, getCustomerById)
customerRouter.patch('/:id', auth, adminGuard, updateCustomer)
customerRouter.delete('/:id', auth, adminGuard, deleteCustomer)

export default customerRouter
