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

## Manual browser checklist

Browser automation could not access the local preview in the authoring environment. The responsive styles and interactions are implemented, but the following checks still require a browser pass; they are not recorded as completed:

- At 1440px: register, add a product, edit it, search, filter and export CSV.
- Reload a protected route and confirm the session is restored from the API.
- Log out, then enter `/app/inventory` directly; expect a redirect to login.
- Open a second account and confirm its inventory starts empty.
- At 390px and 360px: open the navigation drawer, use inventory cards, add/edit products, and inspect expiry watch.
- Toggle both themes, reload and confirm the preference remains.
- Navigate with a keyboard, inspect focus indicators, and close dialogs with Escape.
- Test the empty inventory, wrong-password, duplicate-email, duplicate-SKU, expired-session and network-error states.

## Screenshots for submission

Capture actual browser screenshots after that manual pass and place them in `docs/screenshots/`:

- `registration.png`
- `login.png`
- `dashboard-light.png`
- `dashboard-dark.png`
- `mobile-inventory.png`

The README does not embed placeholder screenshots or claim they have been captured.
