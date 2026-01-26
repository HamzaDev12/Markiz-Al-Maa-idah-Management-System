import { client } from "../utils/twilio.utlis.js";

export const sendWhatsApp = async (to: string, message: string) => {
  try {
    const res = await client.messages.create({
      from: process.env.TWILLIO_WHATSAPP_NUMBER as string,
      to: `whatsApp ${to}`,
      body: message,
    });

    return res;
  } catch (error) {
    console.log("Error Twilio" + error);
    throw new Error("Failed to send WhatsApp message");
  }
};
