import { Request, Response } from "express";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
dotenv.config();

const DB_NAME = process.env.DB_NAME_INSERT;
const MONGO_URI = process.env.MONGO_URI;

let client: MongoClient;
let db: Db;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI!);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Conexão com o MongoDB estabelecida.");
  }
  return db;
}

class UserAlimentos {
  // Método para inserir dados no banco de dados
  async insertData(req: Request, res: Response): Promise<void> {
    const { alimento, nutrientes, grams, day, userId } = req.body;

    // Verificação básica dos campos
    if (!alimento || !nutrientes || !grams || !day || !userId) {
      res.status(400).json({ message: "Todos os campos são obrigatórios" });
      return;
    }

    try {
      const db = await connectToDatabase();
      const collection = db.collection("userData");

      // Inserindo os dados
      const result = await collection.insertOne({
        alimentos: alimento, // Renomeando para 'alimentos'
        nutrientes,
        gramas: grams, // Renomeando para 'gramas'
        refeicao: day, // Renomeando para 'refeicao'
        userId, // Incluindo userId
      });
      
      // Respondendo com sucesso
      res.status(201).json({ message: "Dados inseridos com sucesso", insertedId: result.insertedId });
    } catch (error) {
      console.error("Erro ao inserir dados:", error);
      res.status(500).json({ message: "Erro ao inserir os dados" });
    }
  }

  // Método para buscar dados do banco de dados
  async getData(req: Request, res: Response): Promise<void> {
    try {
      const db = await connectToDatabase();
      const collection = db.collection("userData");

      // Buscando os dados
      const data = await collection.find({}).toArray();
      
      // Respondendo com os dados encontrados
      res.status(200).json({ message: "Dados obtidos com sucesso", data });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      res.status(500).json({ message: "Erro ao buscar os dados" });
    }
  }
}

export default UserAlimentos;
