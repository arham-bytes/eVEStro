const express = require('express');
const router = express.Router();
const {
    getWallet,
    getTransactions,
    addMoney,
    verifyAddMoney,
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post('/add-money', protect, addMoney);
router.post('/verify', protect, verifyAddMoney);

module.exports = router;
