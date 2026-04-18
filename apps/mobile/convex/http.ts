import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';

function base64Encode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const bytes = new TextEncoder().encode(str);
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i], b2 = bytes[i + 1] ?? 0, b3 = bytes[i + 2] ?? 0;
    result += chars[b1 >> 2] + chars[((b1 & 3) << 4) | (b2 >> 4)] + (i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=') + (i + 2 < bytes.length ? chars[b3 & 63] : '=');
  }
  return result;
}

async function sha512(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): Promise<boolean> {
  const hashString = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
  const hash = await sha512(hashString);
  return hash === signatureKey;
}

http.route({
  path: '/midtrans-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;
    const statusCode = body.status_code;
    const grossAmount = body.gross_amount;
    const signatureKey = body.signature_key;

    if (signatureKey) {
      const isValid = await verifySignature(
        orderId,
        statusCode,
        grossAmount.toString(),
        signatureKey
      );
      if (!isValid) {
        console.error('Invalid signature for webhook:', orderId);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    let status: 'pending' | 'success' | 'failed' = 'pending';

    if (
      transactionStatus === 'capture' ||
      transactionStatus === 'settlement'
    ) {
      status = 'success';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      status = 'failed';
    }

    try {
      await ctx.runMutation(internal.payments.updateStatus, {
        gatewayOrderId: orderId,
        status,
      });

      if (status === 'success') {
        const payment = await ctx.runQuery(internal.payments.getByMidtransOrder, {
          gatewayOrderId: orderId,
        });

        if (payment) {
          await ctx.runMutation(internal.courses.enrollAfterPayment, {
            userId: payment.userId,
            courseId: payment.courseId,
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
});

http.route({
  path: '/payment/create',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { userId, courseId } = body;

      if (!userId || !courseId) {
        return new Response(JSON.stringify({ error: 'Missing userId or courseId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const user = await (ctx as any).db.get(userId as any);
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const course = await (ctx as any).db.get(courseId as any);
      if (!course) {
        return new Response(JSON.stringify({ error: 'Course not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (course.type !== 'premium') {
        return new Response(JSON.stringify({ error: 'Course is not premium' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existingEnrollment = await (ctx as any).db
        .query('enrollments')
        .withIndex('by_user_course', (q) =>
          q.eq('userId', userId).eq('courseId', courseId)
        )
        .first();

      if (existingEnrollment) {
        return new Response(JSON.stringify({ error: 'User already enrolled in this course' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const timestamp = Date.now();
      const orderId = `NEXA-${courseId}-${timestamp}`;

      const midtransBody = {
        transaction_details: {
          order_id: orderId,
          gross_amount: course.price,
        },
        customer_details: {
          first_name: user.name || 'Customer',
          email: user.email,
        },
        item_details: [
          {
            id: courseId,
            price: course.price,
            quantity: 1,
            name: course.title,
          },
        ],
      };

      const auth = base64Encode(MIDTRANS_SERVER_KEY + ':');
      const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify(midtransBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `Midtrans API error: ${errorText}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responseData = await response.json();
      const snapToken = responseData.token;
      const redirectUrl = responseData.redirect_url;

      await (ctx as any).db.insert('payments', {
        userId,
        courseId,
        amount: course.price,
        status: 'pending',
        gatewayOrderId: orderId,
        createdAt: Date.now(),
      });

      return new Response(JSON.stringify({
        snapToken,
        orderId,
        redirectUrl,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message || 'Payment creation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
});

http.route({
  path: '/payment/status/:orderId',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const orderId = url.pathname.split('/').pop();

      if (!orderId) {
        return new Response(JSON.stringify({ error: 'Missing orderId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const auth = base64Encode(MIDTRANS_SERVER_KEY + ':');
      const response = await fetch(
        `https://app.sandbox.midtrans.com/v2/${orderId}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Failed to get payment status' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify({
        status: data.transaction_status,
        amount: data.gross_amount,
        paymentType: data.payment_type,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message || 'Failed to get status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
});

export default http;