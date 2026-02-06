export interface ICreateClass {
  teacherId: number;
  name: string;
}

export interface IUpdateClass {
  name: string;
  teacherId: number;
  rank: number;
  averageScore: number;
}
