import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/auth.routes.js";
import teacherRoute from "./routes/teacher.routes.js";
import studentRouter from "./routes/student.routes.js";
import classRouter from "./routes/class.routes.js";
const app = express();
dotenv.config();

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cors());

app.use("/api/user", userRouter);
app.use("/api/teacher", teacherRoute);
app.use("/api/student", studentRouter);
app.use("/api/class", classRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
