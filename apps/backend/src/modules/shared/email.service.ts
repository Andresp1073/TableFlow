import { logger } from "../../config/logger.js";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const emailService = {
  async send(options: EmailOptions): Promise<void> {
    if (!options.to) {
      throw new Error("Recipient email is required");
    }

    logger.info(
      { to: options.to, subject: options.subject },
      "Email dispatched (development stub)"
    );
  },

  async sendPasswordReset(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/reset-password?token=${resetToken}`;

    await emailService.send({
      to: email,
      subject: "TableFlow — Password Reset Request",
      text: `You requested a password reset. Use this link to reset your password: ${resetUrl}. This link expires in 1 hour. If you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p><p>If you did not request this, please ignore this email.</p>`,
    });
  },

  async sendVerificationEmail(
    email: string,
    verificationToken: string
  ): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/verify-email?token=${verificationToken}`;

    await emailService.send({
      to: email,
      subject: "TableFlow — Verify Your Email",
      text: `Welcome to TableFlow! Please verify your email by clicking this link: ${verifyUrl}. This link expires in 24 hours.`,
      html: `<p>Welcome to TableFlow!</p><p>Please verify your email by clicking <a href="${verifyUrl}">here</a>.</p><p>This link expires in 24 hours.</p>`,
    });
  },

  async sendWelcomeEmail(email: string): Promise<void> {
    await emailService.send({
      to: email,
      subject: "Welcome to TableFlow",
      text: `Your account has been created successfully. Welcome to TableFlow!`,
      html: `<p>Your account has been created successfully.</p><p>Welcome to TableFlow!</p>`,
    });
  },
};

export { emailService };
