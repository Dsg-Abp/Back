declare namespace Express {
  export interface Request {
    user?: any;
  }
}
export interface User {
  _id?: ObjectId;
  googleId?: string;
  email: string;
  nome: string;
  accessToken?: string;
}

export interface Point {
  startTimeNanos?: string;
  endTimeNanos?: string;
  value: {
    intVal?: number;
    floatVal?: number;
  }[];
}

export interface Dataset {
  dataSourceId: string;
  point: Point[];
}

export interface Bucket {
  startTimeMillis: string;
  endTimeMillis: string;
  dataset: Dataset[];
}

export interface GoogleFitResponse {
  bucket: Bucket[];
}

export interface User extends Express.User {
  _id?: ObjectId;
  googleId?: string;
  email: string;
  nome: string;
  senha?: string;
  accessToken?: string;
  refreshToken?: string;
}
