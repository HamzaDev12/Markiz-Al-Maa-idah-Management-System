import type { Gender } from "../generated/prisma/enums.js";

export interface IUpdateStudent {
  phone: string;
  fullName: string;
  email: string;
  gender: Gender;
  image: string;
}
