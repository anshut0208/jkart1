import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

//  Stripe ka object initialize kar rahe hain using secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        //  Stripe webhook se raw body text lena zaroori hai (JSON nahi)
        const body = await request.text();

        //  Stripe signature header fetch kar rahe hain to verify authenticity
        const sig = await request.headers.get('stripe-signature');

        //  Webhook event verify aur parse kar rahe hain
        const event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        //  Helper function: PaymentIntent handle karne ke liye
        const handlePaymentIntent = async (paymentIntentId, isPaid) => {

            //  Payment intent ke sessions fetch kar rahe hain
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId
            });

            //  Metadata se orderIds, userId aur appId nikal rahe hain
            const { orderIds, userId, appId } = session.data[0].metadata;

            //  Security check: appId verify karte hain
            if (appId !== 'gocart') {
                return NextResponse.json({
                    received: true,
                    message: 'Invalid app ID',
                });
            }

            //  Comma-separated string ko array me convert karte hain
            const orderIdsArray = orderIds.split(',');

            //  Agar payment successful hai
            if (isPaid) {
                //  Sabhi orders ko paid mark kar rahe hain
                await Promise.all(
                    orderIdsArray.map(async (orderId) => {
                        await prisma.order.update({
                            where: { id: orderId },
                            data: { isPaid: true },
                        });
                    })
                );
                //  User ka cart clear kar rahe hain
                await prisma.user.update({
                    where: { id: userId },
                    data: { cart: {} }
                });
            } 
            else {
                //  Agar payment fail ya cancel ho gaya
                await Promise.all(
                    orderIdsArray.map(async (orderId) => {
                        await prisma.order.delete({
                            where: { id: orderId }
                        });
                    })
                );
            }
        };

        //  Stripe event ke type ke hisaab se action le rahe hain
        switch (event.type) {
            //  Jab payment successful hota hai
            case 'payment_intent.succeeded': {
                await handlePaymentIntent(event.data.object.id, true);
                break;
            }

            //  Jab payment cancel ya fail hota hai
            case 'payment_intent.canceled': {
                await handlePaymentIntent(event.data.object.id, false);
                break;
            }

            //  Agar koi unknown event aata hai
            default: {
                console.log('Unhandled event type:', event.type);
                break;
            }
        }

        //  Stripe ko response dena zaroori hai taaki wo webhook ko valid maane
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error(error);
        //  Agar koi error aaya toh error message return karenge
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}

//  Next.js config: body parser disable kar rahe hain kyunki Stripe raw body chahta hai
export const config = {
    api: { bodyParser: false }
};
