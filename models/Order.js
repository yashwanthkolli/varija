const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String
    },
    merchantOrderId: {
        type: String,
        required: true,
        unique: true
    },
    products: [{
        prodId: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        wholesale: Number,
        retail: Number,
        name: String
    }],
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    deliveryStatus: {
        type: String,
        enum: ['PROCESSING', 'CONFIRMED', 'OUT FOR DELIVERRY', 'DELIVERED', 'CANCELLED'],
        default: 'PROCESSING'
    },
    phonepeTransactionId: String,
    paymentMethod: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;