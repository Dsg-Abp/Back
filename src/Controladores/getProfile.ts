import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import pool from "../database/db";
dotenv.config();

const DB_NAME = process.env.DB_NAME;

 class imcProfile {
    async getData(req: Request, res: Response): Promise<void> {
        let client: MongoClient | null = null;
        try {
            client = await pool.connect();
            const db = client.db("Users");
            const collection = db.collection("profile");
            const result = await collection.find({}, {projection: { image: 0, _id: 0 } }).toArray();
            res.status(200).json({ message: "Dados recebidos com sucesso!", data: result });
        } catch (err) {
            res.status(500).json({error: "Erro ao pegar dados", err})
        } finally {
            if(client){
                await client.close();
            }
        }
    }

}
export default imcProfile;