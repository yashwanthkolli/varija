const express = require('express');
const router = express.Router();
const razorpayInstance  =  require('../../config/razorpay');
const auth = require('../../middleware/auth');

const Order = require('../../models/Order');
const Cart = require('../../models/Cart')

// @route    POST api/order/
// @desc     Payment RazorPay
// @access   Public
router.post('/', async (req, res) => {
    try{
        const options = {
            amount: req.body.amount*100,
            currency: 'INR'
        }

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating RazorPay order');
    }
})


// @route    POST api/order/create
// @desc     Create Order
// @access   Public
router.post('/create', auth, async(req, res) => {
    try{
        const userId = req.user.id;
        const {paymentId, cart, address, phone} = req.body
        const {bill, products} = cart;
        const newOrder = await Order.create({
            userId,
            products,
            bill,
            paymentId,
            address, 
            phone
        })
        const oldCart = await Cart.findByIdAndDelete(cart._id)
        res.status(200).send(newOrder)
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating order');
    }
})

module.exports = router;