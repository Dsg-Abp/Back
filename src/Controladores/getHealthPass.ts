import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const DB_NAME = process.env.DB_NAME!;

class GetHealthPass {
  async getStepCount(req: Request, res: Response) {
    const userId = req.params.userId;
    console.log("User ID:", userId);

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID do usuário inválido" });
    }

    try {
      const client: MongoClient = pool;
      const db = client.db(DB_NAME);
      const apiGoogleInstantCollection = db.collection("GoogleInstantSteps");

      // Agregar dados instantâneos por dia
      const dailyInstantData = await apiGoogleInstantCollection
        .aggregate([
          { $match: { userId: new ObjectId(userId) } },
          { $unwind: "$data" },
          {
            $group: {
              _id: { date: { $substr: ["$data.date", 0, 10] } }, // Agrupa por data (YYYY-MM-DD)
              totalSteps: { $sum: "$data.steps" },
            },
          },
          { $sort: { "_id.date": 1 } }, // Ordena por data
        ])
        .toArray();

      console.log("Aggregated Instant Step Data:", dailyInstantData);

      res.status(200).json({ dailyInstantData });
    } catch (error: unknown) {
      console.error(
        "Erro ao obter dados instantâneos de contagem de passos:",
        error
      );

      res
        .status(500)
        .json({ error: "Erro ao acessar dados instantâneos de passos" });
    }
  }
}

export default GetHealthPass;
