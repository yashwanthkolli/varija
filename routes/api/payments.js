const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const phonePeClient = require('../../utils/phonepeClient');
const { StandardCheckoutPayRequest, CreateSdkOrderRequest } = require('pg-sdk-node');

const Order = require('../../models/Order');
const Cart = require('../../models/Cart');

router.post('/initiate', async (req, res) => {
  try {
    const { amount, userId, products, address, phone, redirect } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = redirect ? redirect : `${process.env.MERCHANT_REDIRECT_URL}status/${merchantOrderId}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(1 * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();

    const response = await phonePeClient.getClient().pay(request);
    
    // Create the order
    const newOrder = new Order({userId, merchantOrderId, amount, products, address, phone})
    await newOrder.save()

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

// Check payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const response = await phonePeClient.getClient().getOrderStatus(orderId);
    
    // Update order status
    let order = await Order.findOne({merchantOrderId: orderId})
    if(!order) throw new Error('Order not found');
    if(!order.orderId) {
      order = await Order.findOneAndUpdate({merchantOrderId: orderId}, {
        orderId: response.orderId,
        status: response.state,
        phonepeTransactionId: response.paymentDetails[0].transactionId,
        paymentMethod: response.paymentDetails[0].paymentMode
      }, {
        new: true,
        runValidators: true
      })

      // Empty User Cart
      if (response.state === 'COMPLETED') {
        await Cart.findOneAndUpdate({userId: order.userId}, {products: [], bill: 0}, {new: true, runValidators: true})
      }
    }

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

    if (!isValid) {
      console.error('Invalid callback received');
      return res.status(401).json({ error: 'Invalid callback' });
    }

    const callbackData = req.body;
    const orderId = callbackData.payload.merchantOrderId;
    const status = callbackData.payload.state;
    
    let order = await Order.findOne({merchantOrderId: orderId})
    if(!order) throw new Error('Order not found');
    if(!order.orderId) {
      order = await Order.findOneAndUpdate({merchantOrderId: orderId}, {
        orderId: orderId,
        status: status,
        phonepeTransactionId: callbackData.payload.paymentDetails[0].transactionId,
        paymentMethod: callbackData.payload.paymentDetails[0].paymentMode
      }, {
        new: true,
        runValidators: true
      })

      // Empty User Cart
      if (response.state === 'COMPLETED') {
        await Cart.findOneAndUpdate({userId: order.userId}, {products: [], bill: 0}, {new: true, runValidators: true})
      }
    }
    // Update your database with the payment status
    // await updateOrderStatus(orderId, status);

    // Process the callback based on its type
    switch (callbackData.type) {
      case 'PAYMENT_SUCCESS':
        // Handle successful payment
        break;
      case 'PAYMENT_ERROR':
        // Handle payment error
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