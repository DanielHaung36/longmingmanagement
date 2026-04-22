import { Router } from 'express'
import * as orderController from '../controllers/orderController'
import { cookieAuth } from '../middleware/cookieAuth'
import { requireAdmin } from '../middleware/roleAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', orderController.getOrders)
router.get('/:id', orderController.getOrder)
router.post('/', orderController.createOrder)
router.put('/:id', orderController.updateOrder)
router.delete('/:id', requireAdmin, orderController.deleteOrder)

export default router
