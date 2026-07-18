import type { Response } from "express";
import { AuthService } from "./auth.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendNoContent } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.js";

const authService = new AuthService();

export const login = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userAgent = req.headers["user-agent"];
    const result = await authService.login(req.body, req.ip, userAgent);
    sendSuccess(res, result, undefined, "Authentication successful");
  }
);

export const refresh = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userAgent = req.headers["user-agent"];
    const result = await authService.refresh(req.body, req.ip, userAgent);
    sendSuccess(res, result, undefined, "Token refreshed");
  }
);

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userAgent = req.headers["user-agent"];
    await authService.logout(
      req.body,
      req.userId,
      req.ip,
      userAgent
    );
    sendNoContent(res);
  }
);

export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userAgent = req.headers["user-agent"];
    await authService.changePassword(
      req.userId!,
      req.body.currentPassword,
      req.body.newPassword,
      req.ip,
      userAgent
    );
    sendSuccess(res, null, undefined, "Password changed successfully");
  }
);

export const forgotPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userAgent = req.headers["user-agent"];
    const result = await authService.forgotPassword(
      req.body.email,
      req.ip,
      userAgent
    );
    sendSuccess(res, result);
  }
);

export const resetPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userAgent = req.headers["user-agent"];
    await authService.resetPassword(
      req.body.token,
      req.body.password,
      req.ip,
      userAgent
    );
    sendSuccess(res, null, undefined, "Password reset successfully");
  }
);

export const verifyEmail = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.verifyEmail(req.body.token, req.ip);
    sendSuccess(res, null, undefined, "Email verified successfully");
  }
);

export const resendVerification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.resendVerification(req.userId!);
    sendSuccess(res, result);
  }
);

export const resendVerificationEmail = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.resendVerificationEmail(
      req.body.email,
      req.ip
    );
    sendSuccess(res, result);
  }
);

export const getSessions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const sessions = await authService.getSessions(
      req.userId!,
      req.jti!
    );
    sendSuccess(res, sessions);
  }
);

export const getCurrentSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const session = await authService.getCurrentSession(
      req.userId!,
      req.jti!
    );
    sendSuccess(res, session);
  }
);

export const revokeSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.revokeSession(req.params.sessionId as string, req.userId!, req.ip);
    sendNoContent(res);
  }
);

export const unlockUserAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.unlockUserAccount(
      req.params.userId as string,
      req.userId!,
      req.ip
    );
    sendSuccess(res, null, undefined, "Account unlocked successfully");
  }
);

export const revokeAllSessions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.revokeAllSessions(req.userId!, req.jti!);
    sendSuccess(
      res,
      null,
      undefined,
      "All other sessions revoked successfully"
    );
  }
);
