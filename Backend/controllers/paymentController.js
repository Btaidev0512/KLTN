const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const querystring = require('querystring');

const paymentController = {
    // Create general payment
    createPayment: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { order_id, payment_method, amount } = req.body;
            const userId = req.user?.id || null;

            // Verify order exists and belongs to user
            const order = await Order.getById(order_id, userId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Create payment record
            const payment = await Payment.create({
                order_id,
                user_id: userId,
                payment_method,
                amount,
                status: 'pending'
            });

            res.json({
                success: true,
                message: 'Payment created successfully',
                data: payment
            });
        } catch (error) {
            console.error('Error in createPayment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Verify payment (for callbacks)
    verifyPayment: async (req, res) => {
        try {
            const { payment_id, transaction_id, status } = req.body;

            const payment = await Payment.verify(payment_id, transaction_id, status);

            if (payment && payment.status === 'completed') {
                // Update order status to paid
                await Order.updatePaymentStatus(payment.order_id, 'paid');
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: payment
            });
        } catch (error) {
            console.error('Error in verifyPayment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Create VNPay payment
    createVNPayPayment: async (req, res) => {
        try {
            const { order_id, amount, bank_code, order_info } = req.body;
            const userId = req.user?.id || null;

            // Verify order
            const order = await Order.getById(order_id, userId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // VNPay configuration
            const vnp_TmnCode = process.env.VNP_TMN_CODE;
            const vnp_HashSecret = process.env.VNP_HASH_SECRET;
            const vnp_Url = process.env.VNP_URL;
            const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

            const date = new Date();
            const createDate = date.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
            const orderId = `${order_id}_${Date.now()}`;

            const vnp_Params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: vnp_TmnCode,
                vnp_Locale: 'vn',
                vnp_CurrCode: 'VND',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: order_info || `Thanh toan don hang ${order_id}`,
                vnp_OrderType: 'other',
                vnp_Amount: amount * 100,
                vnp_ReturnUrl: vnp_ReturnUrl,
                vnp_IpAddr: req.ip,
                vnp_CreateDate: createDate
            };

            if (bank_code) {
                vnp_Params.vnp_BankCode = bank_code;
            }

            // Sort and create signature
            const sortedParams = Object.keys(vnp_Params).sort().reduce((result, key) => {
                result[key] = vnp_Params[key];
                return result;
            }, {});

            const signData = querystring.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac('sha512', vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
            sortedParams['vnp_SecureHash'] = signed;

            const vnpUrl = vnp_Url + '?' + querystring.stringify(sortedParams, { encode: false });

            // Save payment record
            await Payment.create({
                order_id,
                user_id: userId,
                payment_method: 'vnpay',
                amount,
                status: 'pending',
                transaction_ref: orderId
            });

            res.json({
                success: true,
                message: 'VNPay payment URL created',
                data: {
                    payment_url: vnpUrl,
                    order_id: orderId
                }
            });
        } catch (error) {
            console.error('Error in createVNPayPayment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // VNPay callback
    vnpayCallback: async (req, res) => {
        try {
            const vnp_Params = req.query;
            const secureHash = vnp_Params['vnp_SecureHash'];
            
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            const vnp_HashSecret = process.env.VNP_HASH_SECRET;
            const sortedParams = Object.keys(vnp_Params).sort().reduce((result, key) => {
                result[key] = vnp_Params[key];
                return result;
            }, {});

            const signData = querystring.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac('sha512', vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

            if (secureHash === signed) {
                const orderId = vnp_Params['vnp_TxnRef'];
                const rspCode = vnp_Params['vnp_ResponseCode'];

                if (rspCode === '00') {
                    // Payment successful
                    const payment = await Payment.updateByTransactionRef(orderId, {
                        status: 'completed',
                        transaction_id: vnp_Params['vnp_TransactionNo'],
                        gateway_response: JSON.stringify(vnp_Params)
                    });

                    if (payment) {
                        await Order.updatePaymentStatus(payment.order_id, 'paid');
                    }

                    res.redirect(`${process.env.FRONTEND_URL}/payment/success?order=${orderId}`);
                } else {
                    // Payment failed
                    await Payment.updateByTransactionRef(orderId, {
                        status: 'failed',
                        gateway_response: JSON.stringify(vnp_Params)
                    });

                    res.redirect(`${process.env.FRONTEND_URL}/payment/failed?order=${orderId}`);
                }
            } else {
                res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=invalid_signature`);
            }
        } catch (error) {
            console.error('Error in vnpayCallback:', error);
            res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=system_error`);
        }
    },

    // VNPay IPN (Instant Payment Notification)
    vnpayIPN: async (req, res) => {
        try {
            const vnp_Params = req.query;
            const secureHash = vnp_Params['vnp_SecureHash'];
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            // Verify signature
            const vnp_HashSecret = process.env.VNP_HASH_SECRET;
            const sortedParams = Object.keys(vnp_Params).sort().reduce((result, key) => {
                result[key] = vnp_Params[key];
                return result;
            }, {});

            const signData = querystring.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac('sha512', vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

            if (secureHash === signed) {
                const payment = await Payment.getByTransactionRef(orderId);
                
                if (payment) {
                    if (rspCode === '00') {
                        // Update payment status
                        await Payment.updateByTransactionRef(orderId, {
                            status: 'completed',
                            transaction_id: vnp_Params['vnp_TransactionNo']
                        });

                        await Order.updatePaymentStatus(payment.order_id, 'paid');
                        
                        res.json({ RspCode: '00', Message: 'success' });
                    } else {
                        await Payment.updateByTransactionRef(orderId, { status: 'failed' });
                        res.json({ RspCode: '00', Message: 'success' });
                    }
                } else {
                    res.json({ RspCode: '01', Message: 'Order not found' });
                }
            } else {
                res.json({ RspCode: '97', Message: 'Checksum failed' });
            }
        } catch (error) {
            console.error('Error in vnpayIPN:', error);
            res.json({ RspCode: '99', Message: 'Unknown error' });
        }
    },

    // Create MoMo payment (simplified)
    createMoMoPayment: async (req, res) => {
        try {
            const { order_id, amount, order_info } = req.body;
            const userId = req.user?.id || null;

            // Verify order exists
            const order = await Order.getById(order_id, userId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // MoMo configuration
            const partnerCode = process.env.MOMO_PARTNER_CODE;
            const accessKey = process.env.MOMO_ACCESS_KEY;
            const secretKey = process.env.MOMO_SECRET_KEY;
            const endpoint = process.env.MOMO_ENDPOINT;
            const redirectUrl = process.env.MOMO_REDIRECT_URL;
            const ipnUrl = process.env.MOMO_IPN_URL;

            // Check if MoMo is configured
            if (!partnerCode || !accessKey || !secretKey) {
                return res.status(501).json({
                    success: false,
                    message: 'MoMo payment chưa được cấu hình. Vui lòng liên hệ admin.'
                });
            }

            const requestId = `${order_id}_${Date.now()}`;
            const orderId = `MM${order_id}`;
            const orderInfo = order_info || `Thanh toan don hang #${order_id}`;
            const requestType = "captureWallet";
            const extraData = "";

            // Create raw signature
            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
            
            // Generate signature
            const hmac = crypto.createHmac('sha256', secretKey);
            const signature = hmac.update(rawSignature).digest('hex');

            // Request body
            const requestBody = {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang: 'vi'
            };

            console.log('🔄 Sending MoMo request:', requestBody);

            // Send request to MoMo
            const axios = require('axios');
            const momoResponse = await axios.post(endpoint, requestBody);

            console.log('📥 MoMo response:', momoResponse.data);

            if (momoResponse.data.resultCode === 0) {
                // Save payment record
                await Payment.create({
                    order_id,
                    payment_method: 'momo',
                    amount,
                    status: 'pending',
                    gateway_transaction_id: requestId,
                    gateway_response: momoResponse.data
                });

                res.json({
                    success: true,
                    message: 'MoMo payment URL created',
                    data: {
                        payment_url: momoResponse.data.payUrl,
                        qr_code_url: momoResponse.data.qrCodeUrl,
                        deep_link: momoResponse.data.deeplink,
                        order_id: orderId
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to create MoMo payment',
                    error: momoResponse.data
                });
            }
        } catch (error) {
            console.error('Error in createMoMoPayment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // MoMo callback
    momoCallback: async (req, res) => {
        try {
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature
            } = req.body;

            console.log('📥 MoMo callback received:', req.body);

            // Verify signature
            const secretKey = process.env.MOMO_SECRET_KEY;
            const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
            
            const hmac = crypto.createHmac('sha256', secretKey);
            const computedSignature = hmac.update(rawSignature).digest('hex');

            if (signature !== computedSignature) {
                console.error('❌ Invalid MoMo signature');
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=invalid_signature`);
            }

            // Update payment status
            if (resultCode === 0) {
                // Payment successful
                const payment = await Payment.getByGatewayTransactionId(requestId);
                
                if (payment) {
                    await Payment.updateStatus(payment.payment_id, 'completed', {
                        transId,
                        message,
                        responseTime
                    }, new Date());

                    await Order.updatePaymentStatus(payment.order_id, 'paid');
                    
                    res.redirect(`${process.env.FRONTEND_URL}/payment/success?order=${orderId}`);
                } else {
                    res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=payment_not_found`);
                }
            } else {
                // Payment failed
                const payment = await Payment.getByGatewayTransactionId(requestId);
                if (payment) {
                    await Payment.updateStatus(payment.payment_id, 'failed', {
                        resultCode,
                        message,
                        responseTime
                    });
                }
                
                res.redirect(`${process.env.FRONTEND_URL}/payment/failed?order=${orderId}&error=${message}`);
            }
        } catch (error) {
            console.error('Error in momoCallback:', error);
            res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=system_error`);
        }
    },

    // MoMo IPN
    momoIPN: async (req, res) => {
        try {
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature
            } = req.body;

            console.log('📥 MoMo IPN received:', req.body);

            // Verify signature
            const secretKey = process.env.MOMO_SECRET_KEY;
            const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
            
            const hmac = crypto.createHmac('sha256', secretKey);
            const computedSignature = hmac.update(rawSignature).digest('hex');

            if (signature !== computedSignature) {
                console.error('❌ Invalid MoMo signature in IPN');
                return res.json({ resultCode: 97, message: 'Invalid signature' });
            }

            const payment = await Payment.getByGatewayTransactionId(requestId);

            if (payment) {
                if (resultCode === 0) {
                    // Payment successful
                    await Payment.updateStatus(payment.payment_id, 'completed', {
                        transId,
                        message,
                        responseTime
                    }, new Date());

                    await Order.updatePaymentStatus(payment.order_id, 'paid');
                    
                    res.json({ resultCode: 0, message: 'Success' });
                } else {
                    // Payment failed
                    await Payment.updateStatus(payment.payment_id, 'failed', {
                        resultCode,
                        message,
                        responseTime
                    });
                    
                    res.json({ resultCode: 0, message: 'Confirmed' });
                }
            } else {
                res.json({ resultCode: 1, message: 'Order not found' });
            }
        } catch (error) {
            console.error('Error in momoIPN:', error);
            res.json({ resultCode: 99, message: 'Unknown error' });
        }
    },

    // Get payment status
    getPaymentStatus: async (req, res) => {
        try {
            const paymentId = req.params.paymentId;
            const userId = req.user?.id || null;

            const payment = await Payment.getById(paymentId, userId);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            res.json({
                success: true,
                message: 'Payment status retrieved',
                data: payment
            });
        } catch (error) {
            console.error('Error in getPaymentStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get payment history
    getPaymentHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const payments = await Payment.getUserPayments(userId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                message: 'Payment history retrieved',
                data: payments
            });
        } catch (error) {
            console.error('Error in getPaymentHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = paymentController;