import { prisma } from "../libs/prisma.js";

export const sendNotifications = async (
  userId: number,
  message: string,
  title: string,
) => {
  try {
    await prisma.notification.create({
      data: {
        message,
        userId,
        title,
      },
    });
  } catch (error) {
    console.log("Error Sending Notification");
  }
};
