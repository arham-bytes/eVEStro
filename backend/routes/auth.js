const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getMe, 
    updateProfile, 
    registerValidation, 
    loginValidation, 
    forgotPassword, 
    resetPassword, 
    sendPreSignupOTP, 
    verifyPreSignupOTP 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// OTP Verification Routes (Pre-registration)
router.post('/send-pre-signup-otp', sendPreSignupOTP);
router.post('/verify-pre-signup-otp', verifyPreSignupOTP);

module.exports = router;
