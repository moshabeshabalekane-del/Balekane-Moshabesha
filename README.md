# Counter — Shop & Bar POS

A small, responsive, browser-based point-of-sale starter for a shop, bar, or food counter. No build step or package installation is required.

## Run it

Open `index.html` in a modern browser, or serve this folder with any static web server. The app stores its demo catalog and orders in the browser's `localStorage` on the current device.

## Included

- Product search, category filters, stock counts, and a current-sale cart
- Add and remove catalog items
- Cash sale recording, order history, and CSV export
- Payment method selection for EcoCash, M-Pesa, C Pay, Khetsi, and bank cards
- Responsive layout for desktop, tablet, and mobile

## Payment integration status — important

The online payment methods are **placeholders only**. Selecting one creates an order with **Pending** status; this app does not contact a provider, initiate a payment, or claim that funds were received. Cash orders are recorded as paid. Do not use this demo to accept live payments.

To enable real payments, add a secure server-side integration for each provider, confirm the correct merchant APIs and supported markets with the providers, store credentials as server secrets, verify signed payment callbacks/webhooks, and only mark an order paid after server-side confirmation. For bank cards, use the provider's hosted checkout/tokenized flow; never collect or store card numbers in this frontend. Add authentication, authorization, backups, audit logging, tax settings, and server-side inventory/order persistence before production use.

This starter uses USD for display and does not implement taxes or service charges. Change currency and business settings to match your location and accounting requirements before use.
