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
