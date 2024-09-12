import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const DB_NAME_AGUA = process.env.DB_NAME_AGUA;

class Agua {
  
    async registera(req: Request, res: Response) {
    const { email, somewater, day } = req.body;

    let client: MongoClient | null = null;

    try {
      client = await pool.connect(); // Conectar ao banco de dados
      const db = client.db(DB_NAME_AGUA);
      const collection = db.collection("IDagua");

      //coloca os dados 
      const newUser = {
        email,
        somewater,
        day,
        createdAt: new Date(),
      };

      // Insere o novo usuário na coleção
      const result = await collection.insertOne(newUser);
      res.status(201).json({
        user: { ...newUser, _id: result.insertedId, senha: undefined },
      });
    } catch (error) {
      console.error("Erro ao registrar agua:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}

export default Agua;
