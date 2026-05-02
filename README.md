# 🌱 Tienda de Frutos Secos Sostenibles — Adyen Integration

A full-stack e-commerce application built on Node.js/Express that integrates Adyen's Drop-in payment component. The project extends an existing sustainable food nutrition guide by adding a shop layer that sells healthy, environmentally-scored nuts.

## Business Case
The app sells nuts selected based on their sustainability score from the existing food database. Products with a score of 5 (maximum) are priced as premium, while products with a score of 3 are standard. The data model directly drives the business logic — sustainability score determines pricing tier.

## Architecture
- **controller/server.js** — Express routes, Adyen session creation, webhook handler
- **model/shopModel.js** — Products and orders queries
- **view/shop.html** — Product listing with sustainability scores
- **view/checkout.html** — Adyen Drop-in component
- **view/confirmacion.html** — Payment confirmation page

## Payment Flow
1. User selects a product on /shop
2. Frontend calls POST /api/payment-session
3. Server creates an order in the DB (estado: 'pendiente')
4. Server calls Adyen Sessions API → returns sessionId + sessionData
5. Frontend initializes Adyen Drop-in with the session
6. User completes payment
7. Adyen sends webhook to POST /api/webhooks
8. Server updates order (estado: 'pagado' or 'fallido') and stores pspReference
9. User is redirected to /confirmacion

## Key Adyen Concepts
- **Sessions API** — creates payment session server-side, keeping API keys secure
- **Drop-in component** — Adyen's prebuilt UI handling card input and 3DS
- **Webhooks** — server-to-server notification, source of truth for payment status
- **pspReference** — Adyen's unique transaction ID stored on every order
- **HMAC verification** — webhook signature verification for authenticity

## Tech Stack
Node.js, Express, MySQL, Vanilla JS, Adyen Node.js SDK, Docker, OpenShift

## Setup
1. Clone the repo
2. Run npm install
3. Run mysql -u root Comida < Comida.sql
4. Create .env with your Adyen sandbox credentials:
   ADYEN_API_KEY=your_sandbox_api_key
   ADYEN_MERCHANT_ACCOUNT=your_merchant_account
   ADYEN_CLIENT_KEY=your_client_key
   ADYEN_HMAC_KEY=your_hmac_key
5. Run npm start
6. For webhooks, use ngrok to expose localhost:
   ngrok http 3000
   Then configure the ngrok URL as your webhook endpoint in the Adyen Customer Area.

## Notes
- Credentials stored in .env, never committed to version control
- Orders created before payment — marked 'fallido' if payment fails
- pspReference stored on every order for traceability