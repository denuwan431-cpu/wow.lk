# WOWSHOPPING V52 — PayHere Visa/Mastercard Admin-Configured

This version removes KOKO from the customer payment flow and keeps:
- Visa / Mastercard via PayHere
- Bank Transfer
- Cash on Delivery

## PayHere configuration
Admin Panel → Payments → Visa / Mastercard — PayHere:
1. Enable PayHere.
2. Enter the PayHere Merchant ID.
3. Enter the PayHere Merchant Secret.
4. Choose Live or Sandbox.
5. Optional: set the public return URL.
6. Save.

The Merchant Secret is sent to the secure Firebase backend and is never read back into the browser. The backend uses it to generate the PayHere checkout hash and verify PayHere's server notification checksum before marking an order paid.

PayHere requires a public `notify_url`; localhost cannot receive PayHere server notifications. The backend notify URL is:
`https://asia-south1-wowshopping-cd8bd.cloudfunctions.net/payhereNotify`

Before live use, deploy the updated Firebase Functions/Hosting/Firestore rules and make sure the PayHere domain is approved in PayHere Integrations.

Official PayHere docs:
https://support.payhere.lk/api-%26-mobile-sdk/checkout-api
