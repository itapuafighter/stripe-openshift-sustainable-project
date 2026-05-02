# 🌱 Tienda de Frutos Secos Sostenibles — Stripe Integration

A full-stack e-commerce application built on Node.js/Express that integrates Stripe's Payment Element. The project extends an existing sustainable food nutrition guide by adding a shop layer that sells healthy, environmentally-scored nuts.

## Business Case
The app sells nuts selected based on their sustainability score from the existing food database. Products with a score of 5 (maximum) are priced as premium, while products with a score of 3 are standard. The data model directly drives the business logic — sustainability score determines pricing tier.

## Architecture
- **controller/server.js** — Express routes, Stripe PaymentIntent creation, webhook handler
- **model/shopModel.js** — Products and orders queries
- **view/shop.html** — Product listing with sustainability scores
- **view/checkout.html** — Stripe Payment Element
- **view/confirmacion.html** — Payment confirmation page

## Payment Flow
1. User selects a product on /shop
2. Frontend calls POST /api/payment-session
3. Server creates an order in the DB (estado: pendiente)
4. Server calls Stripe PaymentIntents API and returns clientSecret
5. Frontend initializes Stripe Payment Element with the clientSecret
6. User completes payment
7. Stripe sends webhook to POST /api/webhooks
8. Server verifies HMAC signature and updates order (estado: pagado or fallido)
9. Stripe PaymentIntent ID stored as pspReference for traceability
10. User is redirected to /confirmacion

## Key Stripe Concepts
- **PaymentIntents API** — creates payment intent server-side, keeping secret key secure
- **Payment Element** — Stripe's prebuilt UI handling card input, 3DS, and multiple payment methods
- **Webhooks** — server-to-server notification, source of truth for payment status
- **HMAC signature verification** — ensures webhooks genuinely come from Stripe
- **PaymentIntent ID** — unique transaction ID stored on every order for traceability

## Tech Stack
Node.js, Express, MySQL, Vanilla JS, Stripe Node.js SDK, Docker, OpenShift

## Setup
1. Clone the repo
2. Run npm install
3. Run mysql -u root Comida < Comida.sql
4. Create .env with your Stripe credentials:
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
5. Run npm start
6. For webhooks, use ngrok to expose localhost:
   ngrok http 3000
   Then configure the ngrok URL as webhook endpoint in Stripe dashboard.

## Test Card
Card number: 4242 4242 4242 4242
Expiry: any future date
CVC: any 3 digits

## Notes
- Credentials stored in .env, never committed to version control
- Orders created before payment — marked fallido if payment fails
- PaymentIntent ID stored on every order for traceability
- Webhook signature verified on every request for security