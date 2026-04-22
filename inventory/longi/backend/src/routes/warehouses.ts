import { Router } from 'express'
import * as warehouseController from '../controllers/warehouseController'
import { cookieAuth } from '../middleware/cookieAuth'
import { requireAdmin } from '../middleware/roleAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', warehouseController.getWarehouses)
router.post('/', warehouseController.createWarehouse)
router.put('/:id', warehouseController.updateWarehouse)
router.delete('/:id', requireAdmin, warehouseController.deleteWarehouse)

export default router
