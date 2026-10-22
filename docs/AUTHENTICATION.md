# Week 6 · Task 2: Frontend-to-backend authentication

StockWise builds on the earlier TokenNest backend structure: its user controller, JWT utilities, authentication middleware and route conventions are retained. The new React interface calls those backend endpoints using Fetch. Application-specific issuer and audience values prevent tokens from the earlier application being accepted here.

## Flow

1. React validates required form fields and submits JSON to `POST /api/auth/register` or `POST /api/auth/login`.
2. Express validates the request with Zod. Passwords are hashed or compared with bcrypt at cost 12.
3. The API signs an HS256 JWT containing subject, issuer, audience, expiry and a unique session ID. A database session record supports server-side revocation.
4. React stores the access token in `sessionStorage` and the public profile in `AuthContext` state. Tokens persist across reloads within that tab, and are removed when the tab session ends.
5. The shared Fetch client sends `Authorization: Bearer <token>` for protected requests.
6. `ProtectedRoute` waits for the `/api/auth/me` check before rendering the workspace. Unauthenticated visitors are redirected to `/login`.
7. Backend middleware independently verifies every protected API call, including the JWT and session record. Inventory queries always include the authenticated user ID.
8. The frontend schedules a session-expiry redirect. An API `401` also clears the token and sends the user back to sign in.
9. Logout revokes the server session before clearing frontend state.

## Storage tradeoff

`sessionStorage` limits persistence to the current browser tab, but it is readable by JavaScript. It is not a substitute for XSS prevention. StockWise uses React’s text escaping, a content security policy, server validation and short-lived tokens. A larger production system could move authentication into secure HttpOnly cookies with CSRF protection and a refresh-token rotation strategy.

## Separation of concerns

| File                                   | Responsibility                                                           |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `src/components/Auth/LoginForm.jsx`    | Controlled password visibility, form submission and error/loading states |
| `src/components/Auth/RegisterForm.jsx` | Registration variant of the account form                                 |
| `src/services/api.js`                  | JSON requests, Bearer header, token storage and API errors               |
| `src/context/AuthContext.jsx`          | Authenticated profile, startup session check, expiry and logout          |
| `src/routes/ProtectedRoute.jsx`        | Guarded React routes                                                     |
| `server/routes/userRoutes.js`          | Backend authentication endpoints                                         |
| `server/controllers/userController.js` | Validation, password hashing and authentication responses                |
| `server/middleware/verifyToken.js`     | JWT and persisted-session verification                                   |

Registration and login use controlled React inputs. React state manages field values, submission, feedback and password visibility.
