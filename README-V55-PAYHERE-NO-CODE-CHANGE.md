# WOWSHOPPING V55 — PayHere Visa/Mastercard Admin Configuration

This build is designed so the website code does not need to be edited after the PayHere merchant account is obtained.

## Admin Panel → Payments → Visa / Mastercard — PayHere
Enter only the values supplied by PayHere:
- Enable PayHere
- Merchant ID
- Merchant Secret (saved only by the secure backend; never shown back to the browser)
- Live or Sandbox
- Return URL (optional; leave blank to use the configured WOWSHOPPING hosting URL)

## What happens after Save
The checkout sends the order to the secure backend. The backend generates the PayHere hash using the stored Merchant Secret and redirects the customer to PayHere. PayHere sends the payment result to the public `payhereNotify` function. The backend verifies the PayHere `md5sig` and marks the order paid only when status code is `2`.

## Important PayHere requirements
- Merchant Secret is domain-specific. In PayHere, approve the exact production domain under Integrations and generate the Merchant Secret for that domain.
- The PayHere notification URL is already wired to the deployed Firebase Function; it must be publicly reachable.
- Do not put Merchant Secret in `index.html` or other browser code.
- For live payments, deploy Firebase Functions/Hosting and use the approved public domain. Localhost cannot receive PayHere payment notifications.

## Current checkout data passed to PayHere
The system passes customer name, email, verified/entered phone, address, city, country, order ID, items, amount and currency. It will refuse to start a PayHere payment if required customer phone/address/city are missing.
