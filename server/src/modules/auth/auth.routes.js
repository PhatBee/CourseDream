import express from 'express';
import { register, login, verifyOTP } from './auth.controller.js';
import { validateRegister } from './auth.validation.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

export default router;