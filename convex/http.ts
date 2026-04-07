import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/midtrans-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;
    const transactionId = body.transaction_id;

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
        midtransOrderId: orderId,
        status,
        midtransTransactionId: transactionId,
      });

      if (status === 'success') {
        const payment = await ctx.runQuery(internal.payments.getByMidtransOrder, {
          midtransOrderId: orderId,
        });

        if (payment) {
          await ctx.runMutation(internal.progress.markLessonComplete, {
            userId: payment.userId,
            courseId: payment.courseId,
            lessonId: payment.courseId as any,
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
});

export default http;
