import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import axios from "axios";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const DB_NAME = process.env.DB_NAME!;
const GOOGLE_FIT_API_URL = "https://fitness.googleapis.com/fitness/v1/users/me";

interface User {
  _id?: ObjectId;
  googleId?: string;
  email: string;
  nome: string;
  accessToken?: string;
}

class HealthController {
  async getHealthData(req: Request, res: Response) {
    const userId = req.params.userId;
    console.log("User ID:", userId); // Verifica o ID do usuário

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID do usuário inválido" });
    }

    try {
      const client: MongoClient = pool;
      const db = client.db(DB_NAME);
      const collection = db.collection<User>("login");

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      console.log("User encontrado:", user); // Verifica se o usuário foi encontrado

      if (!user || !user.accessToken) {
        return res
          .status(401)
          .json({ error: "Token de acesso não encontrado" });
      }

      const accessToken = user.accessToken;
      console.log("Access Token:", accessToken); // Verifica o token de acesso

      const dataSourcesResponse = await axios.get(
        `${GOOGLE_FIT_API_URL}/dataSources`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Data Sources Response:", dataSourcesResponse.data); // Verifica a resposta da API

      const dataSources = dataSourcesResponse.data.dataSource || [];

      const responses = await Promise.all(
        dataSources.map(async (source: any) => {
          const dataSourceId = source.dataSourceId;
          console.log("Data Source ID:", dataSourceId); // Verifica o ID do Data Source

          const datasetsResponse = await axios.get(
            `${GOOGLE_FIT_API_URL}/dataSources/${dataSourceId}/datasets`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log("Datasets Response:", datasetsResponse.data); // Verifica a resposta dos datasets

          const datasets = datasetsResponse.data.dataset || [];
          if (!datasets.length) return null;

          const datasetPromises = datasets.map(async (dataset: any) => {
            const datasetId = dataset.datasetId;
            console.log("Dataset ID:", datasetId); // Verifica o ID do Dataset

            try {
              const dataResponse = await axios.post(
                `${GOOGLE_FIT_API_URL}/dataSources/${dataSourceId}/datasets/${datasetId}:aggregate`,
                {
                  aggregateBy: [{ dataTypeName: source.dataType.name }],
                  bucketByTime: { durationMillis: 60000 },
                  startTimeMillis: Date.now() - 24 * 60 * 60 * 1000,
                  endTimeMillis: Date.now(),
                },
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              console.log("Data Response:", dataResponse.data); // Verifica a resposta dos dados

              return { dataSourceId, data: dataResponse.data };
            } catch (error) {
              console.error(
                `Erro ao obter dados para o datasetId ${datasetId} no dataSourceId ${dataSourceId}:`,
                error
              );
              return null;
            }
          });

          const dataResults = await Promise.all(datasetPromises);
          return dataResults.filter((result) => result !== null);
        })
      );

      res
        .status(200)
        .json(responses.flat().filter((response) => response !== null));
    } catch (error: unknown) {
      console.error("Erro ao obter dados do Google Fit:", error);

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

      res.status(500).json({ error: "Erro ao acessar dados de saúde" });
    }
  }
}

export default HealthController;
