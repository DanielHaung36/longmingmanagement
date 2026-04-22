import { Router } from 'express'
import * as authController from '../controllers/authController'
import { cookieAuth } from '../middleware/cookieAuth'

const router = Router()

router.get('/sso/login', authController.ssoLogin)
router.get('/callback', authController.callback)
router.get('/sso/logout', authController.ssoLogout)
router.get('/verify', authController.verify)
router.get('/me', cookieAuth, authController.me)

export default router
