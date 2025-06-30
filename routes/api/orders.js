const express = require('express');
const router = express.Router();
const razorpayInstance  =  require('../../config/razorpay');
const auth = require('../../middleware/auth');
var mongoose = require('mongoose');
const Order = require('../../models/Order');
const authenticateAdmin = require('../../middleware/authenticateAdmin');

// @route    GET api/order/
// @desc     Get user orders
// @access   Public
router.get('/', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const orders = await Order.find({ userId, status: 'COMPLETED' }).sort({createdAt: -1});
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

router.get('/all', authenticateAdmin, async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // default to page 1
        const limit = parseInt(req.query.limit) || 10; // default to 10 orders per page
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "name"), // optional: populate user info
            Order.countDocuments()
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            orders,
            currentPage: page,
            totalPages,
            totalOrders: total,
        });
    } catch (error) {
        console.error("Error fetching paginated orders:", error);
        res.status(500).json({ message: "Failed to fetch orders", error });
    }
})

router.put('/:orderId', authenticateAdmin, async(req, res) => {
    const { orderId } = req.params;
    const updates = req.body;

    try {
        const order = await Order.findByIdAndUpdate(orderId, updates, {
        new: true,
        runValidators: true,
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        res.json({ message: "Order updated successfully", order });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: "Failed to update order", error });
    }
})

module.exports = router;