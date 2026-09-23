# Admin panel migration

- Removed the embedded admin-panel UI from `index.html`.
- `index.html` now points the Admin Panel link to the standalone `admin.html`.
- Restyled `admin.html` to match the visual language of the removed storefront admin panel:
  dark sidebar, blue active navigation, white sticky top bar, compact bordered cards,
  matching buttons, tables, forms, and responsive behavior.
- Existing admin.html functionality/data logic was preserved.
