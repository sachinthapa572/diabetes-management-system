import "express";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: string;
      email: string;
      role: string;
      first_name: string;
      last_name: string;
    };
  }
}
