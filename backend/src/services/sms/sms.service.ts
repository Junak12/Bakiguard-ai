import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

/**
 * Every SMS gateway (SSL Wireless, BulkSMSBD, Twilio, ...) implements this.
 * Adding a provider = one new file + one entry in `providers` + the env enum.
 */
export interface SmsProvider {
  readonly name: string;
  send(to: string, message: string): Promise<void>;
}

export interface SentSms {
  to: string;
  message: string;
  at: Date;
}

/** Prints messages instead of sending them. Keeps a short in-memory outbox for tests. */
class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  readonly outbox: SentSms[] = [];

  async send(to: string, message: string) {
    this.outbox.push({ to, message, at: new Date() });

    if (this.outbox.length > 100) {
      this.outbox.shift();
    }

    if (!env.isTest) {
      logger.info({ to, message }, "[console SMS]");
    }
  }
}

export const consoleSmsProvider = new ConsoleSmsProvider();

const providers: Record<typeof env.SMS_PROVIDER, SmsProvider> = {
  console: consoleSmsProvider,
};

const provider = providers[env.SMS_PROVIDER];

export async function sendSms(to: string, message: string) {
  await provider.send(to, message);
}
