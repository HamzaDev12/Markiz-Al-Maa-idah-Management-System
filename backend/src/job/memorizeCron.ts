import cron from "node-cron";
import { prisma } from "../libs/prisma.js";
import { sendNotifications } from "../services/sendNotifications.service.js";
import { sendWhatsApp } from "../services/whatsApp.service.js";
import { sendEmail } from "../services/sendEmail.service.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Checking expired memorization targets...");

  const today = new Date();

  const expiredTargets = await prisma.memorizationTarget.findMany({
    where: {
      dueDate: { lte: today },
      status: "IN_PROGRESS",
    },
    include: {
      student: {
        include: {
          user: true,
          parent: { include: { user: true } },
          halaqa: { include: { teacher: { include: { user: true } } } },
        },
      },
    },
  });

  for (const target of expiredTargets as any) {
    const message = `Mudadii taxdiidka ardayga ${target.student.user.fullName} way dhamaatay.`;

    await sendNotifications(
      target.student.user.id,
      message,
      "Taxdiid Dhamaaday",
    );

    if (target.student.parent?.user?.id) {
      await sendNotifications(
        target.student.parent.user.id,
        message,
        "Taxdiid Dhamaaday",
      );
    }

    const teacherId = target.student.halaqa?.teacher?.user?.id;

    if (teacherId) {
      await sendNotifications(teacherId, message, "Taxdiid Dhamaaday");
    }

    await sendWhatsApp(target.student.user.phone, message);

    await sendEmail(target.student.user.email, "Taxdiid Dhamaaday", message);
  }
});
