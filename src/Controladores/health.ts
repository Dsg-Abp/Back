import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import axios from "axios";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const DB_NAME = process.env.DB_NAME!;
const GOOGLE_FIT_API_URL = "https://fitness.googleapis.com/fitness/v1/users/me";

interface DataSource {
  dataSourceId: string;
  dataType: { name: string };
}

interface Dataset {
  datasetId: string;
}

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

      // Obter fontes de dados do Google Fit
      const dataSourcesResponse = await axios.get(
        `${GOOGLE_FIT_API_URL}/dataSources`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Data Sources Response:", dataSourcesResponse.data);

      const dataSources: DataSource[] =
        dataSourcesResponse.data.dataSource || [];
      console.log("Data Sources:", dataSources);

      // Filtrar fluxos de dados relevantes
      const relevantDataSources = dataSources.filter((source) =>
        [
          "com.google.heart_rate.bpm",
          "com.google.step_count.cumulative",
          "com.google.activity.segment",
          "com.google.weight",
          "com.google.height",
          "com.google.calories.expended",
        ].includes(source.dataType.name)
      );
      console.log("Relevant Data Sources:", relevantDataSources);

      // Obter dados dos fluxos de dados relevantes
      const responses = await Promise.all(
        relevantDataSources.map(async (source) => {
          const dataSourceId = source.dataSourceId;
          console.log("Data Source ID:", dataSourceId);

          if (!dataSourceId) {
            console.warn("Data Source ID está ausente.");
            return null;
          }

          try {
            // Obter datasets para o dataSourceId
            const datasetsResponse = await axios.get(
              `${GOOGLE_FIT_API_URL}/dataSources/${dataSourceId}/datasets`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            console.log("Datasets Response:", datasetsResponse.data);

            const datasets: Dataset[] = datasetsResponse.data.dataset || [];
            console.log("Datasets:", datasets);

            if (!datasets.length) return null;

            // Obter dados agregados para cada dataset
            const datasetPromises = datasets.map(async (dataset) => {
              const datasetId = dataset.datasetId;
              console.log("Dataset ID:", datasetId);

              if (!datasetId) {
                console.warn("Dataset ID está ausente.");
                return null;
              }

              try {
                const dataResponse = await axios.post(
                  `${GOOGLE_FIT_API_URL}/dataSources/${dataSourceId}/datasets/${datasetId}:aggregate`,
                  {
                    aggregateBy: [{ dataTypeName: source.dataType.name }],
                    bucketByTime: { durationMillis: 60000 }, // 1 minuto
                    startTimeMillis: Date.now() - 24 * 60 * 60 * 1000, // Últimos 24 horas
                    endTimeMillis: Date.now(),
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                console.log("Data Response:", dataResponse.data);

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
          } catch (error) {
            console.error(
              `Erro ao obter datasets para o dataSourceId ${dataSourceId}:`,
              error
            );
            return null;
          }
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
