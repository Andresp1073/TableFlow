import { Router } from "express";
import {
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  resendVerificationEmail,
  getSessions,
  getCurrentSession,
  revokeSession,
  revokeAllSessions,
  unlockUserAccount,
} from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  sessionIdSchema,
} from "./auth.validation.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { rateLimiter } from "../../middlewares/rateLimiter.js";
import { env } from "../../config/env.js";

const router = Router();

const authRateLimit = rateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.AUTH_RATE_LIMIT_MAX,
});

router.post("/login", authRateLimit, validate(loginSchema), login);
router.post(
  "/refresh",
  authRateLimit,
  validate(refreshTokenSchema),
  refresh
);
router.post(
  "/logout",
  requireAuth,
  authRateLimit,
  validate(logoutSchema),
  logout
);

router.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  changePassword
);

router.post(
  "/forgot-password",
  authRateLimit,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  authRateLimit,
  validate(resetPasswordSchema),
  resetPassword
);

router.post(
  "/verify-email",
  authRateLimit,
  validate(verifyEmailSchema),
  verifyEmail
);
router.post(
  "/resend-verification",
  requireAuth,
  authRateLimit,
  resendVerification
);
router.post(
  "/resend-verification-email",
  authRateLimit,
  validate(resendVerificationEmailSchema),
  resendVerificationEmail
);

router.get("/sessions", requireAuth, getSessions);
router.get("/sessions/current", requireAuth, getCurrentSession);
router.delete("/sessions", requireAuth, revokeAllSessions);
router.delete("/sessions/:sessionId", requireAuth, validate(sessionIdSchema), revokeSession);

router.post(
  "/users/:userId/unlock",
  requireAuth,
  requireRole("Super Admin"),
  unlockUserAccount
);

export default router;
