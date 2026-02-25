import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/auth.routes.js";
import teacherRoute from "./routes/teacher.routes.js";
import studentRouter from "./routes/student.routes.js";
import classRouter from "./routes/class.routes.js";
import memorizationTarget from "./routes/memrozie.routes.js";
import parent from "./routes/parent.routes.js";
import "./job/memorizeCron.js";
const app = express();
dotenv.config();

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/users", userRouter);
app.use("/api/teachers", teacherRoute);
app.use("/api/students", studentRouter);
app.use("/api/classes", classRouter);
app.use("/api/memorization-targets", memorizationTarget);
app.use("/api/parents", parent);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
