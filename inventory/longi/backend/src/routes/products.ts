import { Router } from 'express'
import * as productController from '../controllers/productController'
import { cookieAuth } from '../middleware/cookieAuth'
import { requireAdmin } from '../middleware/roleAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', productController.getProducts)
router.get('/customers', productController.getProductCustomers)
router.get('/stats', productController.getProductStats)
router.get('/:id', productController.getProduct)
router.post('/', productController.createProduct)
router.put('/:id', productController.updateProduct)
router.delete('/:id', requireAdmin, productController.deleteProduct)

export default router
