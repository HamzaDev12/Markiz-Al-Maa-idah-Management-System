import { body } from "express-validator";

export const createHalaqaSchemas = [
  body("name")
    .notEmpty()
    .withMessage("fadlan gali magaca xalqada")
    .isString()
    .withMessage("magacu waa inuu noqda xarfo"),

  body("teacherId")
    .notEmpty()
    .withMessage("fadlan gali id-ga macalinka xalqadan")
    .isNumeric()
    .withMessage("id-gu waa inuu noqda tiro"),
  body("classId")
    .notEmpty()
    .withMessage("fadlan gali id-ga fasalku xalqadan")
    .isNumeric()
    .withMessage("id-gu waa inuu noqda tiro"),
];
