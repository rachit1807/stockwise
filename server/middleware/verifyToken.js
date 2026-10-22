import { readToken } from "../utils/token.js";
export const verifyToken = (store, settings) => async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || "");
  if (!match)
    return res.status(401).json({
      error: "A Bearer access token is required.",
      code: "TOKEN_REQUIRED",
    });
  try {
    const claims = readToken(match[1], settings);
    const session = await store.session(claims.jti);
    const user = await store.byId(claims.sub);
    if (!session || session.user_id !== claims.sub || !user)
      return res.status(401).json({
        error: "This session has ended. Please sign in again.",
        code: "SESSION_ENDED",
      });
    req.user = user;
    req.auth = claims;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res.status(401).json({
        error: "Your access token has expired. Please sign in again.",
        code: "TOKEN_EXPIRED",
      });
    if (["JsonWebTokenError", "NotBeforeError"].includes(error.name))
      return res
        .status(401)
        .json({ error: "The access token is invalid.", code: "TOKEN_INVALID" });
    next(error);
  }
};
