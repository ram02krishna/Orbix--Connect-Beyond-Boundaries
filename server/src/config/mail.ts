import { Resend } from "resend";
import { env } from "./env.js";

export const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send an email.
 * @example
 *   await sendMail({
 *     to: "user@example.com",
 *     subject: "Verify your email",
 *     html: "<p>Your OTP is <b>123456</b></p>",
 *   });
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  return resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html: html || "",
    text,
  });
}
