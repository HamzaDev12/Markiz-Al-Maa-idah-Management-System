import { body } from "express-validator";
const ROLES = ["TEACHER", "PARENT", "STUDENT"];

export const signupSchemas = [
  body("fullName")
    .isString()
    .withMessage("fullName must be a string")
    .notEmpty()
    .withMessage("fullName is required"),
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid format email"),
  body("password")
    .isString()
    .withMessage("password must be a string")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirm_password")
    .isString()
    .withMessage("Enter valid password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom((value, { req }) => value === req.body)
    .withMessage("Password do not match"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isString()
    .withMessage("Role must be a string")
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(", ")}`),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string")
    .matches(/^\+[1-9]\d{7,14}$/)
    .withMessage(
      "Phone number must be in international format (e.g. +252634345678)",
    ),
];

export const loginSchema = [
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid format email"),
  body("password")
    .isString()
    .withMessage("password must be a string")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const updateAdminSchema = [
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isString()
    .withMessage("Role must be a string")
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(", ")}`),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string")
    .matches(/^\+[1-9]\d{7,14}$/)
    .withMessage(
      "Phone number must be in international format (e.g. +252634345678)",
    ),
  body("fullName")
    .isString()
    .withMessage("fullName must be a string")
    .notEmpty()
    .withMessage("fullName is required"),
];
