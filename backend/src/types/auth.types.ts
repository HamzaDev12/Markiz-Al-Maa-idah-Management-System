export interface ICreateUser {
  name: string;
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
  name: string;
  role: string;
  phone: string;
}

export interface IUpdateUserBySelf {
  id: number;
  name: string;
  OldPassword: string;
  role: string;
  newPassword: string;
  confirm: string;
  phone: string;
  email: string;
}

export interface ISendMessage {
  email: string;
  name: string;
  message: string;
  subject: string;
}
