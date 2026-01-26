import { transporter } from "../utils/transporter.js";

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    await transporter.sendMail({
      from: `Markiz Al-Maa'idah ${process.env.MY_GMAIL}`,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.log("Error Sending email" + error);
  }
};

export const sendEmailMessage = async (
  from: string,
  text: string,
  subject: string,
) => {
  try {
    await transporter.sendMail({
      from,
      to: process.env.MY_GMAIL,
      subject,
      text,
    });
  } catch (error) {
    console.log("Error Sending email" + error);
  }
};

export const sendEmailHtml = async (
  subject: string,
  to: string,
  html: string,
) => {
  try {
    await transporter.sendMail({
      from: `Markiz Al-Maa'idah ${process.env.MY_GMAIL}`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log("Error Sending email" + error);
  }
};
