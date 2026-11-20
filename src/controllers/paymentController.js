import { stripe } from "../config/stripe.js";
import { getCollections } from "../config/db.js";

const PLAN_CONFIG = {
    pro_tutor: {
        planName: "Pro Tutor",
        amountUsd: Number(process.env.PRO_TUTOR_PRICE_USD) || 15,
        description: "Unlimited tuition posts, priority placement, and verified tutor badge",
    },
    pro_student: {
        planName: "Pro Student",
        amountUsd: Number(process.env.PRO_STUDENT_PRICE_USD) || 10,
        description: "Priority booking requests and unlimited saved tuitions",
    },
};

async function recordPaymentAndUpgradePlan({
    userEmail,
    userName,
    userRole,
    planName,
    amount,
    currency,
    transactionId,
    stripeSessionId,
}) {
    const { payments, users } = getCollections();
    const normalizedEmail = userEmail.toLowerCase();

    // Prevent duplicate payment records for the same Stripe session
    const existingPayment = await payments.findOne({ stripeSessionId });
    if (!existingPayment) {
        await payments.insertOne({
            userEmail: normalizedEmail,
            userName: userName || normalizedEmail.split("@")[0],
            userRole: userRole || "student",
            planName,
            amount: Number(amount),
            currency: (currency || "usd").toLowerCase(),
            transactionId: transactionId || stripeSessionId,
            stripeSessionId,
            paymentStatus: "paid",
            paidAt: new Date(),
        });
    }

    await users.updateOne(
        { email: normalizedEmail },
        { $set: { plan: "pro" } }
    );
}

export async function createCheckoutSession(req, res, next) {
    try {
        const { planKey } = req.body;
        const plan = PLAN_CONFIG[planKey];

        if (!plan) {
            return res.status(400).json({
                message: "Invalid plan selected. Choose 'pro_tutor' ($15) or 'pro_student' ($10).",
            });
        }

        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: req.user.email,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `MentorLagbe ${plan.planName} Plan`,
                            description: plan.description,
                        },
                        unit_amount: plan.amountUsd * 100,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userEmail: req.user.email,
                userName: req.user.name,
                userRole: req.user.role,
                planName: plan.planName,
                amount: String(plan.amountUsd),
            },
            success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/payment/cancel`,
        });

        return res.status(200).json({
            url: session.url,
            sessionId: session.id,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Stripe Webhook handler (mounted with express.raw() in app.js)
 */
export async function handleStripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        if (webhookSecret && sig) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const meta = session.metadata || {};

        await recordPaymentAndUpgradePlan({
            userEmail: meta.userEmail || session.customer_email,
            userName: meta.userName || session.customer_details?.name,
            userRole: meta.userRole || "student",
            planName: meta.planName || "Pro Plan",
            amount: meta.amount ? Number(meta.amount) : (session.amount_total || 0) / 100,
            currency: session.currency || "usd",
            transactionId: session.payment_intent || session.id,
            stripeSessionId: session.id,
        });
    }

    return res.status(200).json({ received: true });
}

/**
 * Fallback/Client verification on /payment/success?session_id=...
 */
export async function verifyCheckoutSession(req, res, next) {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: "sessionId is required." });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid") {
            return res.status(400).json({ message: "Payment has not been completed yet." });
        }

        const meta = session.metadata || {};
        const targetEmail = meta.userEmail || session.customer_email;

        await recordPaymentAndUpgradePlan({
            userEmail: targetEmail,
            userName: meta.userName || session.customer_details?.name,
            userRole: meta.userRole || "student",
            planName: meta.planName || "Pro Plan",
            amount: meta.amount ? Number(meta.amount) : (session.amount_total || 0) / 100,
            currency: session.currency || "usd",
            transactionId: session.payment_intent || session.id,
            stripeSessionId: session.id,
        });

        const { users } = getCollections();
        const updatedUser = await users.findOne({ email: targetEmail.toLowerCase() });

        return res.status(200).json({
            message: "Subscription verified and upgraded to Pro.",
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllPaymentsAdmin(req, res, next) {
    try {
        const { payments } = getCollections();
        const transactions = await payments.find({}).sort({ paidAt: -1 }).toArray();
        return res.status(200).json({ transactions });
    } catch (error) {
        next(error);
    }
}