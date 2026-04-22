import { Router } from 'express'
import * as inventoryController from '../controllers/inventoryController'
import { cookieAuth } from '../middleware/cookieAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', inventoryController.getInventory)
router.get('/stats/today', inventoryController.getTodayStats)
router.post('/in', inventoryController.stockIn)
router.post('/out', inventoryController.stockOut)
router.get('/:id/transactions', inventoryController.getTransactions)
router.get('/:id', inventoryController.getInventoryById)
router.put('/:id', inventoryController.updateInventory)

export default router
