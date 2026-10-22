import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { issueToken, readToken, publicUser } from "../utils/token.js";
const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(8)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 bytes.",
  );
const registration = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .regex(/^[^<>\x00-\x1f]+$/, "Name contains unsupported characters."),
    email,
    password,
  })
  .strict();
const loginSchema = z
  .object({ email, password: z.string().min(1).max(200) })
  .strict();
const fallbackHash = await bcrypt.hash("unused-random-account-password", 12);
export function userController(store, settings) {
  const validate = (schema, body, res) => {
    const result = schema.safeParse(body);
    if (!result.success) {
      res.status(400).json({
        error: "Please check your information.",
        code: "VALIDATION_ERROR",
        details: result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return null;
    }
    return result.data;
  };
  const authenticate = async (user, res, status = 200) => {
    const token = issueToken(user, settings);
    const claims = readToken(token, settings);
    await store.addSession(claims.jti, user.id, claims.exp);
    res.status(status).json({
      user: publicUser(user),
      accessToken: token,
      tokenType: "Bearer",
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    });
  };
  return {
    register: async (req, res, next) => {
      try {
        const body = validate(registration, req.body, res);
        if (!body) return;
        const user = {
          id: randomUUID(),
          name: body.name,
          email: body.email,
          password_hash: await bcrypt.hash(body.password, 12),
          created_at: new Date().toISOString(),
        };
        await store.create(user);
        await authenticate(user, res, 201);
      } catch (e) {
        if (
          e.code === "23505" ||
          String(e.message).includes("UNIQUE constraint")
        )
          return res.status(409).json({
            error: "An account with this email already exists.",
            code: "EMAIL_EXISTS",
          });
        next(e);
      }
    },
    login: async (req, res, next) => {
      try {
        const body = validate(loginSchema, req.body, res);
        if (!body) return;
        const user = await store.byEmail(body.email);
        const valid = await bcrypt.compare(
          body.password,
          user?.password_hash || fallbackHash,
        );
        if (!user || !valid)
          return res.status(401).json({
            error: "Email or password is incorrect.",
            code: "INVALID_CREDENTIALS",
          });
        await authenticate(user, res);
      } catch (e) {
        next(e);
      }
    },
    me: (req, res) => res.json({ user: publicUser(req.user) }),
    verify: (req, res) =>
      res.json({ valid: true, user: publicUser(req.user), claims: req.auth }),
    logout: async (req, res, next) => {
      try {
        await store.removeSession(req.auth.jti);
        res.json({ message: "You have been signed out." });
      } catch (e) {
        next(e);
      }
    },
  };
}
