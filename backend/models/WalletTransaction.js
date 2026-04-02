const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        description: {
            type: String,
            required: true,
        },
        reference: {
            type: String,
            default: '',
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        razorpayOrderId: {
            type: String,
            default: '',
        },
        razorpayPaymentId: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'completed',
        },
    },
    { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
