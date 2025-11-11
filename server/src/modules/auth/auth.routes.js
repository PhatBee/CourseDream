import express from 'express';
import { register, login, verifyOTP, googleLogin, facebookLogin } from './auth.controller.js';
import { validateRegister } from './auth.validation.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);

export default router;