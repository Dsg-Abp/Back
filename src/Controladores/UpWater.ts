import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import pool from "../database/db"; // Assumindo que o pool de conexões já foi configurado corretamente

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const DB_NAME_AGUA = process.env.DB_NAME_AGUA;

class Agua {
  // Método para registrar água no banco de dados
  async registera(req: Request, res: Response) {
    const { user, somewater, day } = req.body;

    if (!user || !somewater || !day) {
      res.status(400).json({ message: "Todos os campos são obrigatórios" });
      return;
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME_AGUA);
      const collection = db.collection("IDagua");

      const newUser = {
        user,
        somewater,
        day,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(newUser);
      res.status(201).json({
        user: { ...newUser, _id: result.insertedId },
      });
    } catch (error) {
      console.error("Erro ao registrar água:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Método para buscar registros de água
  async FindAgua(req: Request, res: Response): Promise<void> {
    const { user } = req.body;

    if (!user) {
      res.status(400).json({ message: "O campo user é obrigatório" });
      return;
    }

    let client: MongoClient | null = null;
    try {
      client = await pool.connect();
      const db = client.db(DB_NAME_AGUA);
      const collection = db.collection("IDagua");

      const registrosAgua = await collection
        .find({
          user: new RegExp(user, "i"),
        })
        .toArray();

      if (!registrosAgua || registrosAgua.length === 0) {
        res.status(404).json({ message: "Registros não encontrados" });
        return;
      }

      res.status(200).json(registrosAgua);
    } catch (error) {
      console.error("Erro ao buscar registros:", error);
      res.status(500).json({ message: "Erro ao buscar registros" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Método para buscar dados de teste
  async findTeste(req: Request, res: Response) {
    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME_AGUA);
      const collection = db.collection("IDagua");

      const findResult = await collection.find({}).toArray();
      res.json({ findResult });
    } catch (error) {
      console.error("Erro ao buscar dados de teste:", error);
      res.status(500).json({ message: "Erro ao buscar dados" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Método para inserir dados de teste
  async upTest(req: Request, res: Response) {
    const email = req.body;

    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME_AGUA);
      const collection = db.collection("IDagua");

      const insertResult = await collection.insertOne({ email });
      console.log("Inserted documents =>", insertResult);

      res.json(insertResult);
    } catch (error) {
      console.error("Erro ao inserir dados:", error);
      res.status(500).json({ message: "Erro ao inserir dados" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

}

export default Agua;
