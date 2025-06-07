const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const phonePeClient = require('../../utils/phonepeClient');
const { StandardCheckoutPayRequest, CreateSdkOrderRequest } = require('pg-sdk-node');
const Order = require('../../models/Order');
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  res.send("Hello World");
})

// Save order to database
async function saveOrderToDatabase(merchantOrderId, amount, userId, status, paymentMethod = 'PhonePe') {
  try {
    // Generate a unique orderId
    const orderId = `ORDER_${uuidv4()}`;
    
    // Convert userId to ObjectId if it's a string
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? userId 
      : new mongoose.Types.ObjectId(userId);
    
    const newOrder = new Order({
      orderId,
      merchantOrderId,
      amount,
      userId: userObjectId,
      status,
      paymentMethod
    });
    
    await newOrder.save();
    console.log(`Order saved: ${merchantOrderId}`);
    return newOrder;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}

// Update order status
async function updateOrderStatus(merchantOrderId, status, transactionId = null) {
  try {
    const order = await Order.findOne({ merchantOrderId });
    
    if (!order) {
      console.error(`Order not found: ${merchantOrderId}`);
      return null;
    }
    
    order.status = status;
    if (transactionId) {
      order.phonepeTransactionId = transactionId;
    }
    
    await order.save();
    console.log(`Order updated: ${merchantOrderId}, Status: ${status}`);
    return order;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// Initiate payment via PhonePe checkout page
router.post('/initiate', async (req, res) => {
  console.log(req.body.amount)
  try {
    const { amount, userId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();

    const response = await phonePeClient.getClient().pay(request);
    
    // Save the order to database with PENDING status
    await saveOrderToDatabase(merchantOrderId, amount, userId, 'PENDING');

    res.json({
      success: true,
      checkoutUrl: response.redirectUrl,
      orderId: merchantOrderId
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Payment initiation failed', details: error.message });
  }
});

// Create order for Frontend SDK integration
router.post('/create-sdk-order', async (req, res) => {
  try {
    const { amount, userId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;

    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();

    const response = await phonePeClient.getClient().createSdkOrder(request);
    
    // Save order details to database
    await saveOrderToDatabase(merchantOrderId, amount, userId, 'PENDING');

    res.json({
      success: true,
      token: response.token,
      orderId: merchantOrderId
    });
  } catch (error) {
    console.error('SDK order creation error:', error);
    res.status(500).json({ error: 'Order creation failed', details: error.message });
  }
});

// Check payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const response = await phonePeClient.getClient().getOrderStatus(orderId);
    
    // Update order status in your database based on response.state
    await updateOrderStatus(orderId, response.state);

    res.json({
      success: true,
      status: response.state,
      data: response
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: 'Status check failed', details: error.message });
  }
});

// Handle PhonePe callback
router.post('/callback', async (req, res) => {
  try {
    const authorizationHeader = req.headers['authorization'] || req.headers['Authorization'];
    const responseBody = JSON.stringify(req.body);

    const isValid = await phonePeClient.getClient().validateCallback(
      process.env.MERCHANT_USERNAME,
      process.env.MERCHANT_PASSWORD,
      authorizationHeader,
      responseBody
    );
    console.log(isValid)
    if (!isValid) {
      console.error('Invalid callback received');
      return res.status(401).json({ error: 'Invalid callback' });
    }

    const callbackData = req.body;
    const orderId = callbackData.payload.merchantOrderId;
    const status = callbackData.payload.state;
    const transactionId = callbackData.payload.transactionId;

    // Process the callback based on its type
    switch (callbackData.type) {
      case 'PAYMENT_SUCCESS':
        // Update order status to SUCCESS and save transaction ID
        await updateOrderStatus(orderId, 'SUCCESS', transactionId);
        break;
      case 'PAYMENT_ERROR':
        // Update order status to FAILED
        await updateOrderStatus(orderId, 'FAILED');
        break;
      default:
        console.log('Received unknown callback type:', callbackData.type);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Callback handling error:', error);
    res.status(500).json({ error: 'Callback processing failed', details: error.message });
  }
});

module.exports = router;