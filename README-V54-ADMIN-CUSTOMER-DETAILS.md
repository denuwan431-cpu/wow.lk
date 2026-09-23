# WOWSHOPPING V54 — Admin Customer Details

Admin Customers now loads Firebase Authentication users together with each user's Firestore `users/{uid}` profile.

Shown in Admin Panel:
- Name
- Email
- Phone number
- Phone verified status
- Email verified status
- Address line 1 / address
- Address line 2
- City
- District
- Province
- Postal / ZIP code
- Country
- Created time
- Last sign-in time
- Provider
- UID
- Admin/customer role

The backend endpoint is protected by the Firebase `admin` custom claim. Customer profile data is read server-side and is not exposed to ordinary users through the admin endpoint.

Important: profile fields must actually be saved by the customer-facing profile flow to appear here. This build does not invent missing customer data.
