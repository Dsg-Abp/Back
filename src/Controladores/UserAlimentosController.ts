import { Request, Response } from "express";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
dotenv.config();

const DB_NAME = process.env.DB_NAME_INSERT;
const MONGO_URI = process.env.DATABASE_URL;

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
    async insertData(req: Request, res: Response): Promise<void> {
        const { alimentos, nutrientes, grams, day, userId } = req.body;

        console.log("Dados recebidos:", req.body);

        if (!alimentos || !nutrientes || !grams || !day || !userId) {
            res.status(400).json({ message: "Todos os campos são obrigatórios" });
            return;
        }

        try {
            const db = await connectToDatabase();
            console.log("Banco de dados conectado:", db.databaseName);
            const collection = db.collection("userData");

            const result = await collection.insertOne({
                alimentos,
                nutrientes,
                gramas: grams,
                refeicao: day,
                userId,
                dataInsercao: new Date()
            });

            res.status(201).json({ message: "Dados inseridos com sucesso", insertedId: result.insertedId });
        } catch (error: any) {
            console.error("Erro ao inserir dados:", error.message);
            res.status(500).json({ message: "Erro ao inserir os dados", error: error.message });
        }
    }

    async getData(req: Request, res: Response): Promise<any> {
        const { userId } = req.params;

        // Verifica se o userId foi fornecido
        if (!userId) {
            return res.status(400).json({ error: "O campo userId é obrigatório" });
        }

        try {
            const db = await connectToDatabase();
            const collection = db.collection("userData");

            // Verifica se o campo "nutrientes.calorias" está armazenado como um número e a data é um campo Date no banco de dados
            const pipeline = [
                { $match: { userId } }, // Filtra pelo userId fornecido
                {
                    $addFields: { // Garante que o campo "nutrientes.calorias" é tratado como número
                        "nutrientes.calorias": { $toDouble: "$nutrientes.calorias" }
                    }
                },
                {
                    $group: { // Agrupa os dados por dia
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$dataInsercao" } },
                        totalCalorias: { $sum: "$nutrientes.calorias" }
                    }
                },
                { $sort: { "_id": 1 } } // Ordena por data
            ];

            const data = await collection.aggregate(pipeline).toArray();

            if (data.length > 0) {
                res.status(200).json({ message: "Dados de calorias por dia obtidos com sucesso", data });
            } else {
                res.status(404).json({ error: "Nenhum dado encontrado para este userId" });
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            res.status(500).json({ message: "Erro ao buscar os dados", error });
        }
    }
}

export default UserAlimentos;
