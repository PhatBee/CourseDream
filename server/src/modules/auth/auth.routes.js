import express from 'express';
import { register, login, verifyOTP, googleLogin, facebookLogin, forgotPassword, verifyResetOTP, setPassword, refreshToken, logout } from './auth.controller.js';
import { validateRegister, validateResetPassword } from './auth.validation.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/set-password', validateResetPassword, setPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;