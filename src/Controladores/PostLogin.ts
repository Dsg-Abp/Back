import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../database/db";
("passport-google-oauth20");

const DB_NAME = process.env.DB_NAME!;
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
dotenv.config();

class AuthController {
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios",
      });
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection("login");

      const user = await collection.findOne({ email });

      if (!user || !user.senha) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const isPasswordValid = bcrypt.compareSync(senha, user.senha);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      console.log("User found:", user);

      const { senha: _, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: userWithoutPassword._id.toString() },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        token,
        userId: userWithoutPassword._id.toString(),
      });
    } catch (error) {
      console.error("Erro:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    } finally {
      if (client) {
        client.close();
      }
    }
  }
}

export default AuthController;
