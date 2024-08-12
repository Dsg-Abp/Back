import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";

// Defina uma interface para o payload do JWT
interface JwtPayload {
  id: string;
  // Adicione outras propriedades que possam estar no payload, se necessário
}

// Estenda a interface Request para incluir a propriedade user
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    // Adiciona a propriedade user ao objeto req
    req.user = user as JwtPayload;
    next();
  });
};
