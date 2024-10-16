import { Request, Response } from "express";
import dotenv from "dotenv";
import pool from "../database/db";
import { MongoClient } from "mongodb";
dotenv.config();

const DB_NAME = process.env.DB_NAME_INSERT;

class UserAlimentos {
  // Método para inserir dados no banco de dados
  async insertData(req: Request, res: Response): Promise<void> {
    const { alimento, nutrientes, day } = req.body;

    // Verificação básica dos campos
    if (!alimento || !nutrientes || !day) {
      res.status(400).json({ message: "Todos os campos são obrigatórios" });
      return;
    }

    let client: MongoClient | null = null;

    try {
      // Conectando ao MongoDB
      client = await pool.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection("userData");

      // Inserindo os dados
      const result = await collection.insertOne({ alimento, nutrientes, day });
      
      // Respondendo com sucesso
      res.status(201).json({ message: "Dados inseridos com sucesso", data: result });
    } catch (error) {
      console.error("Erro ao inserir dados:", error);
      res.status(500).json({ message: "Erro ao inserir os dados" });
    } finally {
      // Certifique-se de fechar a conexão com o banco de dados
      if (client) {
        client.close();
      }
    }
  }

  // Método para buscar dados do banco de dados
  async getData(req: Request, res: Response): Promise<void> {
    let client: MongoClient | null = null;

    try {
      // Conectando ao MongoDB
      client = await pool.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection("userData");

      // Buscando os dados
      const data = await collection.find({}).toArray();
      
      // Respondendo com os dados encontrados
      res.status(200).json({ message: "Dados obtidos com sucesso", data });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      res.status(500).json({ message: "Erro ao buscar os dados" });
    } finally {
      // Fechando a conexão com o banco de dados
      if (client) {
        client.close();
      }
    }
  }
}

export default UserAlimentos;