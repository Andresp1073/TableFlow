import { z } from "zod";

export const loginSchema = {
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be at most 255 characters")
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(1, "Password is required")
      .max(128, "Password must be at most 128 characters"),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters"),
      confirmPassword: z.string().min(1, "Password confirmation is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .transform(({ confirmPassword: _, ...rest }) => rest),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be at most 255 characters")
      .transform((v) => v.toLowerCase().trim()),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      token: z.string().min(1, "Reset token is required"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters"),
      passwordConfirmation: z.string().min(1, "Password confirmation is required"),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "Passwords do not match",
      path: ["passwordConfirmation"],
    })
    .transform(({ passwordConfirmation: _, ...rest }) => rest),
};

export const logoutSchema = {
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export const verifyEmailSchema = {
  body: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
};

export const resendVerificationEmailSchema = {
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be at most 255 characters")
      .transform((v) => v.toLowerCase().trim()),
  }),
};

export const sessionIdSchema = {
  params: z.object({
    sessionId: z
      .string()
      .uuid("Invalid session ID format"),
  }),
};
