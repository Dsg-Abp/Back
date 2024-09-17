import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import axios from "axios";
import dotenv from "dotenv";
import pool from "./db";
import { GoogleFitResponse, User } from "../types/custom";

dotenv.config();

const DB_NAME = process.env.DB_NAME!;
const GOOGLE_FIT_API_URL = process.env.GOOGLE_FIT_API_URL;

class HealthPass {
  async getStepCount(req: Request, res: Response) {
    const userId = req.params.userId;
    console.log("User ID:", userId);

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID do usuário inválido" });
    }

    try {
      const client: MongoClient = pool;
      const db = client.db(DB_NAME);
      const collection = db.collection<User>("login");

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      console.log("User encontrado:", user);

      if (!user || !user.accessToken) {
        return res
          .status(401)
          .json({ error: "Token de acesso não encontrado" });
      }

      const accessToken = user.accessToken;
      console.log("Access Token:", accessToken);

      const dataSourceId =
        "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps";

      const startTimeMillis = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const endTimeMillis = Date.now();

      // Obter dados agregados por dia
      const dailyDataResponse = await axios.post<GoogleFitResponse>(
        `${GOOGLE_FIT_API_URL}/dataset:aggregate`,
        {
          aggregateBy: [
            {
              dataSourceId: dataSourceId,
              dataTypeName: "com.google.step_count.delta",
            },
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 dia
          startTimeMillis: startTimeMillis,
          endTimeMillis: endTimeMillis,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Daily Step Count Data Response:", dailyDataResponse.data);

      const dailyBuckets = dailyDataResponse.data.bucket || [];
      const dailyData = dailyBuckets
        .map((bucket) => {
          const startDate = new Date(Number(bucket.startTimeMillis));
          const endDate = new Date(Number(bucket.endTimeMillis));

          const steps = bucket.dataset.flatMap((dataSet) =>
            dataSet.point.map((point) => ({
              date: startDate.toISOString().split("T")[0], // Formatar como YYYY-MM-DD
              steps: point.value[0]?.intVal || 0,
            }))
          );

          return steps;
        })
        .flat();

      const apiGoogleDailyCollection = db.collection("GoogleDailySteps");
      await apiGoogleDailyCollection.insertOne({
        userId: new ObjectId(userId),
        data: dailyData,
        timestamp: new Date(),
      });

      console.log("Dados diários de contagem de passos salvos com sucesso.");

      // Obter dados instantâneos para o dia atual
      const instantStartTimeMillis = Date.now() - 24 * 60 * 60 * 1000;
      const instantEndTimeMillis = Date.now();

      const instantDataResponse = await axios.post<GoogleFitResponse>(
        `${GOOGLE_FIT_API_URL}/dataset:aggregate`,
        {
          aggregateBy: [
            {
              dataSourceId: dataSourceId,
              dataTypeName: "com.google.step_count.delta",
            },
          ],
          bucketByTime: { durationMillis: 600000 },
          startTimeMillis: instantStartTimeMillis,
          endTimeMillis: instantEndTimeMillis,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Instantaneous Step Count Data Response:",
        instantDataResponse.data
      );

      const instantBuckets = instantDataResponse.data.bucket || [];
      const instantData = instantBuckets
        .map((bucket) => {
          const startDate = new Date(Number(bucket.startTimeMillis));
          const endDate = new Date(Number(bucket.endTimeMillis));

          const steps = bucket.dataset.flatMap((dataSet) =>
            dataSet.point.map((point) => ({
              date: startDate.toISOString(), // Inclui data e hora
              steps: point.value[0]?.intVal || 0,
            }))
          );

          return steps;
        })
        .flat();

      const apiGoogleInstantCollection = db.collection("GoogleInstantSteps");
      await apiGoogleInstantCollection.insertOne({
        userId: new ObjectId(userId),
        data: instantData,
        timestamp: new Date(),
      });

      console.log(
        "Dados instantâneos de contagem de passos salvos com sucesso."
      );

      res.status(200).json({ dailyData, instantData });
    } catch (error: unknown) {
      console.error("Erro ao obter contagem de passos do Google Fit:", error);

      if (axios.isAxiosError(error)) {
        console.error("Resposta da API do Google Fit:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error("Headers:", error.response?.headers);
        console.error("Configuração:", error.config);
      } else if (error instanceof Error) {
        console.error("Erro:", error.message);
      } else {
        console.error("Erro desconhecido:", error);
      }

      res.status(500).json({ error: "Erro ao acessar contagem de passos" });
    }
  }
}

export default HealthPass;
