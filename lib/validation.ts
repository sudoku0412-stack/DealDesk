import { z } from "zod";
import { PLATFORMS } from "@/lib/config";

export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Enter your email address.")
    .max(254, "That email address is too long.")
    .pipe(z.email("Enter a valid email address.")),
  platform: z.enum(PLATFORMS, { error: "Pick your main platform." }),
  /** Honeypot: real users never see or fill this field. */
  company: z.string().max(200).optional().default(""),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
