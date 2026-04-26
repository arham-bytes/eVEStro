const { validationResult, body } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const crypto = require('crypto');

// Helper to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validation rules
exports.registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['student', 'organizer']).withMessage('Invalid role'),
];

exports.loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, role, college, phone, referredBy } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Generate OTPs
        const emailOTP = generateOTP();
        const phoneOTP = generateOTP();
        const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            college,
            phone,
            referredBy,
            emailOTP,
            phoneOTP,
            emailOTPExpire: otpExpire,
            phoneOTPExpire: otpExpire,
        });

        // Send OTPs
        await sendEmail({
            to: user.email,
            subject: 'eVEStro - Email Verification OTP',
            html: `
                <div style="font-family: inherit; text-align: center; padding: 20px;">
                    <h2 style="color: #6366f1;">Welcome to eVEStro!</h2>
                    <p>Your OTP for email verification is:</p>
                    <h1 style="letter-spacing: 5px; color: #111;">${emailOTP}</h1>
                    <p style="color: #666; font-size: 12px;">This OTP is valid for 10 minutes.</p>
                </div>
            `
        });

        await sendSMS({
            phone: user.phone,
            message: `Your eVEStro verification code is: ${phoneOTP}. Valid for 10 mins.`
        });

        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                phone: user.phone
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = user.getSignedJwtToken();

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                referralCode: user.referralCode,
                walletBalance: user.walletBalance,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                phone: user.phone,
                referralCode: user.referralCode,
                walletBalance: user.walletBalance,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, college, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, college, phone },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                phone: user.phone,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click the link below to reset your password.</p>
            <a href="${resetUrl}" style="background:#6366f1;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">Reset Password</a>
            <p style="margin-top:20px;color:#666;font-size:12px;">This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        `;

        try {
            const sendEmail = require('../utils/sendEmail');
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Token',
                html: message,
            });

            res.status(200).json({ success: true, message: 'Email sent' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res, next) => {
    try {
        const crypto = require('crypto');
        
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Verify Email
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.emailOTP || user.emailOTP !== otp || user.emailOTPExpire < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isEmailVerified = true;
        user.emailOTP = undefined;
        user.emailOTPExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify Phone
// @route   POST /api/auth/verify-phone
exports.verifyPhone = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.phoneOTP || user.phoneOTP !== otp || user.phoneOTPExpire < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isPhoneVerified = true;
        user.phoneOTP = undefined;
        user.phoneOTPExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Phone verified successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTPs
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res, next) => {
    try {
        const { type } = req.body; // 'email' or 'phone'
        const user = await User.findById(req.user._id);

        const otp = generateOTP();
        const expire = Date.now() + 10 * 60 * 1000;

        if (type === 'email') {
            user.emailOTP = otp;
            user.emailOTPExpire = expire;
            await user.save();
            await sendEmail({
                to: user.email,
                subject: 'eVEStro - New Email OTP',
                html: `<h1>${otp}</h1>`
            });
        } else {
            user.phoneOTP = otp;
            user.phoneOTPExpire = expire;
            await user.save();
            await sendSMS({
                phone: user.phone,
                message: `Your new eVEStro code is: ${otp}`
            });
        }

        res.json({ success: true, message: `New OTP sent to your ${type}` });
    } catch (error) {
        next(error);
    }
};
