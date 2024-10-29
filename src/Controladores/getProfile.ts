import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import pool from "../database/db";
dotenv.config();

const DB_NAME = process.env.DB_NAME;

class imcProfile {
    async getData(req: Request, res: Response) {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "O campo userId é obrigatório" });
        }
        let client: MongoClient | null = null;
        try {
            client = await pool.connect();
            const db = client.db("Users");
            const collection = db.collection("profile");
            const profile = await collection.findOne({ userId }, { projection: { image: 0, _id: 0 } });
            if (profile) {
                res.status(200).json({ profile });
            } else {
                res.status(404).json({error: "Perfil não encontrado"});
            }
        } catch (err) {
            res.status(500).json({ error: "Erro ao pegar dados", err })
        } finally {
            if (client) {
                await client.close();
            }
        }
    }

}
export default imcProfile;