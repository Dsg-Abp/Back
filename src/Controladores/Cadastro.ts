import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../database/db";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const DB_NAME = process.env.DB_NAME;

class Cadastro {
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect(); // Conectar ao banco de dados
      const db = client.db(DB_NAME);
      const collection = db.collection("login");

      // Verifica se o usuário existe
      const user = await collection.findOne({ email });

      if (user && bcrypt.compareSync(senha, user.senha)) {
        const { senha, ...userWithoutPassword } = user;
        const token = jwt.sign(
          { id: userWithoutPassword._id.toString() },
          SECRET_KEY,
          { expiresIn: "1h" }
        );
        res.status(200).json({ token, user: userWithoutPassword });
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    } finally {
      if (client) {
        await client.close(); // Fechar a conexão com o banco de dados
      }
    }
  }

  async register(req: Request, res: Response) {
    const { email, senha, nome } = req.body;

    if (!email || !senha || !nome) {
      return res
        .status(400)
        .json({ error: "Email, senha e nome são obrigatórios" });
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect(); // Conectar ao banco de dados
      const db = client.db(DB_NAME);
      const collection = db.collection("login");

      // Verifica se o usuário já existe
      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: "Usuário já cadastrado" });
      }

      const hashedPassword = bcrypt.hashSync(senha, 10);

      // Gera um código de recuperação de 6 dígitos
      const recoveryCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const newUser = {
        email,
        senha: hashedPassword,
        nome,
        recoveryCode,
        createdAt: new Date(),
      };

      // Insere o novo usuário na coleção
      const result = await collection.insertOne(newUser);

      // Cria um token JWT
      const token = jwt.sign({ id: result.insertedId.toString() }, SECRET_KEY, {
        expiresIn: "1h",
      });

      res.status(201).json({
        token,
        user: { ...newUser, _id: result.insertedId, senha: undefined },
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}

export default Cadastro;
