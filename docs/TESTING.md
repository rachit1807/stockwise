# Verification record

## Automated checks

Run `npm test` for 13 API integration tests against an isolated in-memory database:

1. Database-backed health check.
2. Registration validation.
3. Registration returns a public profile, JWT and expiry.
4. Duplicate email rejection.
5. Invalid credentials and successful login.
6. Protected profile access and invalid token rejection.
7. Expired token rejection.
8. Inventory endpoints require authentication.
9. Product creation, listing, editing and duplicate SKU protection.
10. Negative stock, impossible dates and extra fields are rejected.
11. Accounts cannot read, edit or delete another account’s products.
12. Owned product deletion.
13. Logout revokes the active session on the server.

`npm run build` compiles the React frontend for production.

## Live browser checks

The initial local browser preview was unavailable. Subsequent checks ran against the deployed HTTPS application at https://stockwise-rachit.onrender.com.

Verified in the browser:

- Registration creates an account and opens the protected workspace.
- A second account starts with an empty inventory.
- Sample inventory loads into the signed-in account.
- A product quantity changed from 8 to 9 and the updated value appeared in search.
- Searching for `cold` returns one matching product.
- Category filtering narrows eight products to three beverages.
- CSV export produces a downloadable file.
- Product creation works from the 360px mobile form.
- Wrong-password login shows a clear error; correct credentials open the workspace.
- Logout followed by a direct protected-route visit redirects to login.
- Desktop light/dark themes render correctly.
- Mobile inventory uses stacked cards at 390px.
- Mobile navigation opens and the expiry view is reachable.
- The expiry timeline renders at 360px.
- Document width equals viewport width at 390px and 360px (no horizontal page overflow).

Saved evidence in `docs/screenshots/`:

- `registration.png`
- `login.png`
- `dashboard-light.png`
- `dashboard-dark.png`
- `mobile-inventory.png`
- `mobile-expiry.png`

## Limits

API tests cover invalid credentials, duplicate emails/SKUs, invalid input, expired tokens, revocation and account isolation. Cross-browser, physical-device, offline, full screen-reader and comprehensive keyboard testing have not been completed. Mobile checks used browser viewport emulation, not physical phones.
