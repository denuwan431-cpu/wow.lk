# WOWSHOPPING V10 — Clean Product Fix

This build fixes the main storefront interaction issues found in V9.

## Key fixes
- Product cards now open the correct product reliably, including numeric/string product IDs.
- Added delegated product-card click fallback for dynamically rendered cards.
- Product detail rendering is guarded against invalid/missing products.
- Add to Cart now validates stock and quantity.
- Buy Now only proceeds to checkout when the product was actually added.
- Quick View no longer forces size `M`; it uses the product's first available size/color.
- Cart product ID comparisons are type-safe.
- Existing admin catalog syncing/localStorage behavior is preserved.

## Files
- `index.html` — storefront
- `admin.html` — admin panel
- `README-V10.md` — previous README

## Important
The storefront uses CDN resources (Tailwind, Lucide, Firebase), so those resources need internet access when the page is opened unless you later self-host them.
