import type { Response } from "express";

export const auth = "Please log in to continue";
export const serverError = "Oops! something went wrong please try again!";
export const fill = "Please fill all inputs ";

export const cathError = (error: any, res: Response) => {
  console.log(error);
  res.status(500).json({
    message: serverError,
  });
};

export const shorRes = (
  res: Response,
  statusCode: number,
  message: string,
  object?: any,
) => {
  res.status(statusCode).json({
    message,
    object,
  });
};
