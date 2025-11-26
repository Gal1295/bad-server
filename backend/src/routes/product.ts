import { Router } from 'express'
import {
    createProduct,
    deleteProduct,
    getProducts,
    updateProduct,
} from '../controllers/products'
import auth, { adminGuard } from '../middlewares/auth'
import {
    validateObjId,
    validateProductBody,
    validateProductUpdateBody,
} from '../middlewares/validations'

const productRouter = Router()

productRouter.get('/', getProducts)
productRouter.post('/', auth, adminGuard, validateProductBody, createProduct)
productRouter.delete(
    '/:productId',
    auth,
    adminGuard,
    validateObjId,
    deleteProduct
)
productRouter.patch(
    '/:productId',
    auth,
    adminGuard,
    validateObjId,
    validateProductUpdateBody,
    updateProduct
)

export default productRouter
