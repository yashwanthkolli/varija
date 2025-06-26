const express = require('express');
const router = express.Router();
const razorpayInstance  =  require('../../config/razorpay');
const auth = require('../../middleware/auth');

const Order = require('../../models/Order');

// @route    GET api/order/
// @desc     Get user orders
// @access   Public
router.get('/', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const orders = await Order.find({ userId, status: 'COMPLETED' });
        if (orders && orders.length > 0) {
            res.status(200).send(orders);
        } else {
            res.send(null);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
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