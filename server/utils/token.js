import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
export function issueToken(user, settings) {
  return jwt.sign({}, settings.secret, {
    algorithm: "HS256",
    subject: user.id,
    jwtid: randomUUID(),
    expiresIn: settings.expiresIn,
    issuer: settings.issuer,
    audience: settings.audience,
  });
}
export function readToken(token, settings) {
  return jwt.verify(token, settings.secret, {
    algorithms: ["HS256"],
    issuer: settings.issuer,
    audience: settings.audience,
  });
}
export const publicUser = ({ id, name, email, created_at }) => ({
  id,
  name,
  email,
  createdAt: created_at,
});
