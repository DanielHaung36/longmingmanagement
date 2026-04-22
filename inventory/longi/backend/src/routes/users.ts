import { Router } from 'express'
import * as userController from '../controllers/userController'
import { cookieAuth } from '../middleware/cookieAuth'
import { requireAdmin } from '../middleware/roleAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', userController.getUsers)
router.get('/:id', userController.getUser)
router.put('/:id', userController.updateUser)

export default router
