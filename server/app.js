import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { userRoutes } from "./routes/userRoutes.js";
import { verifyToken } from "./middleware/verifyToken.js";
const date = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Enter a valid expiry date.",
  );
const productSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    sku: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .transform((v) => v.toUpperCase()),
    category: z.enum([
      "Groceries",
      "Beverages",
      "Personal care",
      "Household",
      "Other",
    ]),
    quantity: z.number().int().min(0).max(1000000),
    threshold: z.number().int().min(0).max(1000000),
    price: z.number().min(0).max(10000000),
    expiry: date,
    supplier: z.string().trim().max(100),
  })
  .strict();
export function createApp(store, settings) {
  const app = express();
  if (settings.production) app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "img-src": ["'self'", "data:"],
          "upgrade-insecure-requests": settings.production ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/api/health", async (req, res) => {
    try {
      await store.ping();
      res.json({ status: "ok", service: "stockwise" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: settings.rateLimit || 40,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again in 15 minutes." },
  });
  app.use("/api/auth", userRoutes(store, settings, limiter));
  app.use("/api/products", verifyToken(store, settings));
  app.get("/api/products", async (req, res) =>
    res.json({
      products: await store.query(
        "SELECT * FROM products WHERE user_id = ? ORDER BY updated_at DESC",
        [req.user.id],
      ),
    }),
  );
  const save = async (req, res, next) => {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ error: parsed.error.issues[0].message });
      const p = parsed.data,
        now = new Date().toISOString(),
        id = req.params.id || randomUUID();
      if (req.params.id) {
        const rows = await store.query(
          "UPDATE products SET name=?,sku=?,category=?,quantity=?,threshold=?,price=?,expiry=?,supplier=?,updated_at=? WHERE id=? AND user_id=? RETURNING *",
          [
            p.name,
            p.sku,
            p.category,
            p.quantity,
            p.threshold,
            p.price,
            p.expiry,
            p.supplier,
            now,
            id,
            req.user.id,
          ],
        );
        if (!rows.length)
          return res.status(404).json({ error: "Product not found." });
        return res.json({ product: rows[0] });
      }
      const rows = await store.query(
        "INSERT INTO products (id,user_id,name,sku,category,quantity,threshold,price,expiry,supplier,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *",
        [
          id,
          req.user.id,
          p.name,
          p.sku,
          p.category,
          p.quantity,
          p.threshold,
          p.price,
          p.expiry,
          p.supplier,
          now,
          now,
        ],
      );
      res.status(201).json({ product: rows[0] });
    } catch (e) {
      if (e.code === "23505" || String(e.message).includes("UNIQUE constraint"))
        return res
          .status(409)
          .json({ error: "This SKU already exists in your inventory." });
      next(e);
    }
  };
  app.post("/api/products", save);
  app.put("/api/products/:id", save);
  app.delete("/api/products/:id", async (req, res) => {
    const rows = await store.query(
      "DELETE FROM products WHERE id=? AND user_id=? RETURNING id",
      [req.params.id, req.user.id],
    );
    res
      .status(rows.length ? 200 : 404)
      .json(
        rows.length
          ? { message: "Product deleted." }
          : { error: "Product not found." },
      );
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use(express.static(fileURLToPath(new URL("../dist", import.meta.url))));
  app.get("/{*path}", (req, res) =>
    res.sendFile(fileURLToPath(new URL("../dist/index.html", import.meta.url))),
  );
  app.use((error, req, res, next) => {
    console.error("Request failed:", error.message);
    const status =
      error.type === "entity.too.large"
        ? 413
        : error instanceof SyntaxError && error.status === 400
          ? 400
          : 500;
    res
      .status(status)
      .json({
        error:
          status === 500
            ? "Something went wrong. Please try again."
            : "Invalid request body.",
      });
  });
  return app;
}
