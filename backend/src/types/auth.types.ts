export interface ICreateUser {
  fullName: string;
  password: string;
  role: string;
  confirm: string;
  phone: string;
  email: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IUpdateUserByAdmin {
  id: number;
  fullName: string;
  role: string;
  phone: string;
}

export interface IUpdateUserBySelf {
  id: number;
  fullName: string;
  OldPassword: string;
  role: string;
  newPassword: string;
  confirm: string;
  phone: string;
  email: string;
}

export interface ISendMessage {
  email: string;
  fullName: string;
  message: string;
  subject: string;
}
