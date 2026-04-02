const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

const getRazorpay = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc    Get wallet balance and recent transactions
// @route   GET /api/wallet
exports.getWallet = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Ensure walletBalance exists for older users
        if (user.walletBalance === undefined || user.walletBalance === null) {
            user.walletBalance = 0;
            await user.save();
        }

        const recentTransactions = await WalletTransaction.find({
            user: req.user._id,
            status: 'completed',
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                balance: user.walletBalance || 0,
                transactions: recentTransactions,
            },
        });
    } catch (error) {
        console.error('getWallet error:', error.message || error);
        next(error);
    }
};

// @desc    Get wallet transactions (paginated)
// @route   GET /api/wallet/transactions
exports.getTransactions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const total = await WalletTransaction.countDocuments({
            user: req.user._id,
            status: 'completed',
        });

        const transactions = await WalletTransaction.find({
            user: req.user._id,
            status: 'completed',
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create Razorpay order to add money to wallet
// @route   POST /api/wallet/add-money
exports.addMoney = async (req, res, next) => {
    try {
        const { amount } = req.body;

        if (!amount || amount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be at least ₹1',
            });
        }

        if (amount > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum add limit is ₹50,000 per transaction',
            });
        }

        const razorpay = getRazorpay();
        const receipt = `wlt_${Date.now()}`;
        
        console.log('Creating Razorpay order for wallet top-up:', { amount, receipt });
        
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay uses paisa
            currency: 'INR',
            receipt,
            notes: {
                userId: req.user._id.toString(),
                purpose: 'wallet_topup',
            },
        });

        console.log('Razorpay order created:', order.id);

        // Create pending transaction record
        await WalletTransaction.create({
            user: req.user._id,
            type: 'credit',
            amount,
            description: 'Wallet top-up',
            razorpayOrderId: order.id,
            balanceAfter: 0, // Will be updated on verification
            status: 'pending',
        });

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Wallet addMoney error:', error.message || error);
        next(error);
    }
};

// @desc    Verify payment and credit wallet
// @route   POST /api/wallet/verify
exports.verifyAddMoney = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await WalletTransaction.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'failed' }
            );
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed',
            });
        }

        // Find pending transaction
        const transaction = await WalletTransaction.findOne({
            razorpayOrderId: razorpay_order_id,
            status: 'pending',
        });

        if (!transaction) {
            return res.status(400).json({
                success: false,
                message: 'Transaction not found or already processed',
            });
        }

        // Credit wallet
        const user = await User.findById(req.user._id);
        user.walletBalance += transaction.amount;
        await user.save();

        // Update transaction
        transaction.razorpayPaymentId = razorpay_payment_id;
        transaction.balanceAfter = user.walletBalance;
        transaction.status = 'completed';
        await transaction.save();

        res.json({
            success: true,
            message: `₹${transaction.amount} added to wallet`,
            data: {
                balance: user.walletBalance,
                transaction,
            },
        });
    } catch (error) {
        next(error);
    }
};
