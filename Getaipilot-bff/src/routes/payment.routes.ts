import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { RazorpayService } from '../services/razorpay.service.js';
import { JWTPayload } from '../types/index.js';

const createOrderSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(10000000, 'Amount cannot exceed 10,000,000 INR'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('INR'),
  product: z.string().min(1, 'Product is required').default('social'),
  planId: z.string().min(1, 'planId is required'),
  planName: z.string().min(1, 'planName is required'),
  billingInterval: z.enum(['month', 'quarterly', 'six_months', 'year'], {
    errorMap: () => ({ message: 'billingInterval must be month, quarterly, six_months, or year' }),
  }),
  notes: z.record(z.string()).optional(),
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(5, 'Valid Razorpay orderId is required'),
  paymentId: z.string().min(5, 'Valid Razorpay paymentId is required'),
  signature: z.string().min(10, 'Valid Razorpay signature is required'),
  planId: z.string().min(1, 'planId is required'),
  planName: z.string().min(1, 'planName is required'),
  billingInterval: z.enum(['month', 'quarterly', 'six_months', 'year'], {
    errorMap: () => ({ message: 'billingInterval must be month, quarterly, six_months, or year' }),
  }),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  currency: z.string().length(3).default('INR'),
  product: z.string().min(1).default('social'),
  isTestMode: z.boolean().optional(),
});

const createQrSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero'),
  currency: z.string().length(3).default('INR'),
  product: z.string().min(1).default('social'),
  planId: z.string().min(1, 'planId is required'),
  planName: z.string().min(1, 'planName is required'),
  billingInterval: z.enum(['month', 'quarterly', 'six_months', 'year']),
});

const verifyQrNumberSchema = z.object({
  qrId: z.string().min(3, 'qrId is required'),
  number: z.string().min(4, 'Valid Phone Number, UPI Ref, or Payment ID is required'),
  orderId: z.string().optional(),
  planId: z.string().min(1, 'planId is required'),
  planName: z.string().min(1, 'planName is required'),
  billingInterval: z.enum(['month', 'quarterly', 'six_months', 'year']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  product: z.string().min(1).default('social'),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  // 1. GET /mobile/v1/payments/razorpay/config
  fastify.get('/payments/razorpay/config', { preHandler: [authenticateToken] }, async (_request, reply) => {
    const config = RazorpayService.getConfig();
    return reply.send(config);
  });

  // 2. POST /mobile/v1/payments/razorpay/create-order
  fastify.post('/payments/razorpay/create-order', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;

    const parseResult = createOrderSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        issues: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    try {
      const order = await RazorpayService.createOrder({
        userId: user.user_id,
        userEmail: user.email,
        amount: data.amount,
        currency: data.currency,
        product: data.product,
        planId: data.planId,
        planName: data.planName,
        billingInterval: data.billingInterval,
        notes: data.notes,
      });

      return reply.send({
        success: true,
        order,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        statusCode: 500,
        error: 'OrderCreationFailed',
        message: err?.message || 'Failed to create payment order with Razorpay',
      });
    }
  });

  // 3. POST /mobile/v1/payments/razorpay/verify-payment
  fastify.post('/payments/razorpay/verify-payment', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;

    const parseResult = verifyPaymentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        issues: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    try {
      const verification = await RazorpayService.verifyPayment({
        userId: user.user_id,
        userEmail: user.email,
        orderId: data.orderId,
        paymentId: data.paymentId,
        signature: data.signature,
        planId: data.planId,
        planName: data.planName,
        billingInterval: data.billingInterval,
        amount: data.amount,
        currency: data.currency,
        product: data.product,
        isTestMode: data.isTestMode,
      });

      return reply.send({
        success: true,
        data: verification,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(400).send({
        statusCode: 400,
        error: 'PaymentVerificationFailed',
        message: err?.message || 'Signature verification failed',
      });
    }
  });

  // 3b. POST /mobile/v1/payments/razorpay/create-qr
  fastify.post('/payments/razorpay/create-qr', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;

    const parseResult = createQrSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        issues: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    try {
      const qrData = await RazorpayService.createQrCode({
        userId: user.user_id,
        userEmail: user.email,
        userName: user.email?.split('@')[0] || 'Subscriber',
        amount: data.amount,
        currency: data.currency,
        product: data.product,
        planId: data.planId,
        planName: data.planName,
        billingInterval: data.billingInterval,
      });

      return reply.send({
        success: true,
        data: qrData,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        statusCode: 500,
        error: 'QrCreationFailed',
        message: err?.message || 'Failed to create QR code with Razorpay',
      });
    }
  });

  // 3c. POST /mobile/v1/payments/razorpay/verify-qr-number
  fastify.post('/payments/razorpay/verify-qr-number', { preHandler: [authenticateToken] }, async (request, reply) => {
    const user = request.user as JWTPayload;

    const parseResult = verifyQrNumberSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        issues: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    try {
      const verification = await RazorpayService.verifyQrPaymentByNumber({
        userId: user.user_id,
        userEmail: user.email,
        qrId: data.qrId,
        number: data.number,
        orderId: data.orderId,
        planId: data.planId,
        planName: data.planName,
        billingInterval: data.billingInterval,
        amount: data.amount,
        currency: data.currency,
        product: data.product,
      });

      return reply.send({
        success: true,
        data: verification,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(400).send({
        statusCode: 400,
        error: 'PaymentVerificationFailed',
        message: err?.message || 'QR Payment verification failed',
      });
    }
  });

  // 3d. GET /mobile/v1/payments/razorpay/qr-status/:qrId
  fastify.get('/payments/razorpay/qr-status/:qrId', { preHandler: [authenticateToken] }, async (request, reply) => {
    const params = request.params as { qrId: string };
    if (!params.qrId) {
      return reply.status(400).send({ statusCode: 400, error: 'ValidationError', message: 'qrId is required' });
    }

    const status = await RazorpayService.getQrStatus(params.qrId);
    return reply.send({ success: true, ...status });
  });

  // 4. GET /mobile/v1/payments/razorpay/checkout-page (Official Razorpay Standard Checkout in browser)
  fastify.get('/payments/razorpay/checkout-page', async (request, reply) => {
    const q = request.query as Record<string, string>;
    const orderId = q.orderId || '';
    const keyId = q.keyId || RazorpayService.getConfig().keyId;
    const amount = q.amount || '899';
    const amountInPaise = Math.round(Number(amount) * 100);
    const planName = q.planName || 'SocialPilot Plan';
    const planId = q.planId || 'pro';
    const billingInterval = q.billingInterval || 'month';
    const userId = q.userId || 'subscriber-app-user';
    const product = q.product || 'social';
    const email = q.email || '';
    const name = q.name || 'Subscriber';
    const phone = q.phone || '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GetAiPilot - Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .logo-badge {
      display: inline-flex;
      background: rgba(236, 72, 153, 0.15);
      color: #ec4899;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    h2 { margin: 0 0 8px; font-size: 22px; font-weight: 900; }
    p { margin: 0 0 20px; font-size: 13px; color: #94a3b8; }
    .amount-box {
      background: #1e293b;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .amount { font-size: 32px; font-weight: 900; color: #ec4899; }
    .btn {
      background: #ec4899;
      color: #ffffff;
      border: none;
      padding: 16px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 800;
      width: 100%;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
    }
    .status { margin-top: 16px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-badge">RAZORPAY SECURE CHECKOUT</div>
    <h2>${planName}</h2>
    <p>Upgrade workspace quotas and multi-channel automation</p>
    <div class="amount-box">
      <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">PAYABLE AMOUNT</div>
      <div class="amount">₹${amount}</div>
    </div>
    <button id="rzp-button" class="btn" onclick="openRazorpay()">Proceed with Razorpay</button>
    <div id="status" class="status">Click button above if checkout popup does not appear automatically</div>
  </div>

  <script>
    var options = {
      "key": "${keyId}",
      "amount": "${amountInPaise}",
      "currency": "INR",
      "name": "GetAiPilot Ecosystem",
      "description": "${planName}",
      "order_id": "${orderId}",
      "prefill": {
        "name": "${name}",
        "email": "${email}",
        "contact": "${phone}"
      },
      "theme": {
        "color": "#ec4899"
      },
      "handler": function (response) {
        document.getElementById('status').innerText = 'Payment authorized! Verifying cryptographic signature...';
        document.getElementById('status').style.color = '#10b981';

        fetch('/mobile/v1/payments/razorpay/verify-web-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            planId: "${planId}",
            planName: "${planName}",
            billingInterval: "${billingInterval}",
            amount: Number("${amount}"),
            currency: "INR",
            product: "${product}",
            userId: "${userId}",
            email: "${email}",
            isTestMode: ${RazorpayService.getConfig().isTestMode ? 'true' : 'false'}
          })
        }).then(function() {
          window.location.href = '/mobile/v1/payments/razorpay/payment-success?payment_id=' + encodeURIComponent(response.razorpay_payment_id) + '&order_id=' + encodeURIComponent(response.razorpay_order_id) + '&planName=' + encodeURIComponent("${planName}");
        }).catch(function() {
          window.location.href = '/mobile/v1/payments/razorpay/payment-success?payment_id=' + encodeURIComponent(response.razorpay_payment_id) + '&order_id=' + encodeURIComponent(response.razorpay_order_id) + '&planName=' + encodeURIComponent("${planName}");
        });
      },
      "modal": {
        "ondismiss": function() {
          document.getElementById('status').innerText = 'Checkout dismissed. You can reopen anytime.';
        }
      }
    };

    var rzp1;
    function openRazorpay() {
      try {
        rzp1 = new Razorpay(options);
        rzp1.open();
      } catch (e) {
        document.getElementById('status').innerText = 'Error launching Razorpay: ' + e.message;
      }
    }

    // Auto-launch on page load
    window.addEventListener('load', function() {
      setTimeout(openRazorpay, 400);
    });
  </script>
</body>
</html>`;

    reply.type('text/html').send(html);
  });

  // 5. POST /mobile/v1/payments/razorpay/verify-web-checkout (Callback for standard checkout.js)
  fastify.post('/payments/razorpay/verify-web-checkout', async (request, reply) => {
    const parseResult = verifyPaymentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
    }

    const data = parseResult.data;
    const body = request.body as any;
    const userId = body.userId || 'subscriber-app-user';

    try {
      const verification = await RazorpayService.verifyPayment({
        userId,
        userEmail: body.email || '',
        orderId: data.orderId,
        paymentId: data.paymentId,
        signature: data.signature,
        planId: data.planId,
        planName: data.planName,
        billingInterval: data.billingInterval,
        amount: data.amount,
        currency: data.currency,
        product: data.product,
        isTestMode: data.isTestMode ?? RazorpayService.getConfig().isTestMode,
      });

      return reply.send({
        success: true,
        data: verification,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(400).send({
        statusCode: 400,
        error: 'PaymentVerificationFailed',
        message: err?.message || 'Signature verification failed',
      });
    }
  });

  // 5. GET /mobile/v1/payments/razorpay/payment-success (Callback display)
  fastify.get('/payments/razorpay/payment-success', async (request, reply) => {
    const q = request.query as Record<string, string>;
    const paymentId = q.payment_id || '';
    const orderId = q.order_id || '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #090d16; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #0f172a; padding: 32px; border-radius: 20px; border: 1px solid #1e293b; max-width: 360px; width: 90%; }
    .icon { width: 64px; height: 64px; border-radius: 32px; background: #10b981; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2 style="margin:0 0 8px;">Payment Verified!</h2>
    <p style="color:#94a3b8; font-size:13px; margin:0 0 16px;">Your workspace upgrade is now active.</p>
    <div style="font-size:11px; color:#64748b; word-break:break-all;">Payment ID: ${paymentId}<br>Order ID: ${orderId}</div>
    <p style="margin-top:24px; font-size:12px; color:#ec4899; font-weight:bold;">Return to the GetAiPilot App</p>
  </div>
</body>
</html>`;

    reply.type('text/html').send(html);
  });
}
