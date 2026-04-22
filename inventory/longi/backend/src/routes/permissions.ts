import { Router } from 'express'
import * as permissionController from '../controllers/permissionController'
import { cookieAuth } from '../middleware/cookieAuth'

const router = Router()

router.use(cookieAuth)

router.get('/', permissionController.getPermissions)
router.get('/modules', permissionController.getPermissionModules)

export default router
