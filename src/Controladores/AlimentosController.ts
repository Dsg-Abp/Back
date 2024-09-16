import { Request, Response } from "express";
import dotenv from "dotenv";
import pool from "./db";
import { MongoClient } from "mongodb";
dotenv.config();

const DB_NAME = process.env.DB_NAME_ALIMENTOS;

class Alimentos {
  async Find(req: Request, res: Response): Promise<void> {
    const { descricao } = req.body;

    if (!descricao) {
      res.status(400).json({ message: "Descrição do alimento é obrigatória" });
      return;
    }

    let client: MongoClient | null = null;
    try {
      client = await pool.connect(); // Conectar ao banco de dados
      const db = client.db(DB_NAME);
      const collection = db.collection("produtos");

      // Corrigir a busca para refletir a estrutura dos dados
      const alimentos = await collection
        .find({
          "Descrição do Alimento": new RegExp(descricao, "i"),
        })
        .toArray();

      // Retornar os resultados
      res.status(200).json(alimentos);
    } catch (error) {
      console.error("Erro ao buscar alimentos:", error);
      res.status(500).json({ message: "Erro ao buscar alimentos" });
    } finally {
      if (client) {
        await client.close(); // Fechar a conexão com o banco de dados
      }
    }
  }
}

export default Alimentos;
