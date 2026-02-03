import twilio from "twilio";

export const client = twilio(
  process.env.TWILLIO_ACCOUNT_SID!,
  process.env.TWILLIO_AUTH_TOKEN!,
);
