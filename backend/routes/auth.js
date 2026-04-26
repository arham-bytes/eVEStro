const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, registerValidation, loginValidation, forgotPassword, resetPassword, verifyEmail, verifyPhone, resendOTP } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// OTP Verification Routes
router.post('/verify-email', protect, verifyEmail);
router.post('/verify-phone', protect, verifyPhone);
router.post('/resend-otp', protect, resendOTP);

module.exports = router;
