import { Router } from 'express'
import * as productGroupController from '../controllers/productGroupController'
import { cookieAuth } from '../middleware/cookieAuth'
import { requireAdmin } from '../middleware/roleAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', productGroupController.getProductGroups)
router.post('/', productGroupController.createProductGroup)
router.put('/:id', productGroupController.updateProductGroup)
router.delete('/:id', requireAdmin, productGroupController.deleteProductGroup)

export default router
