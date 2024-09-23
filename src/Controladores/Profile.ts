import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const DB_NAME = process.env.DB_NAME;

class Profile {
  async saveProfile(req: Request, res: Response) {
    const { nome, peso, altura, genero, dataNascimento } = req.body;

    if (!nome || !peso || !altura || !genero || !dataNascimento) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection("profile");

      const newProfile = {
        nome,
        peso,
        altura,
        genero,
        dataNascimento,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(newProfile);

      res.status(201).json({
        message: "Perfil salvo com sucesso",
        profile: { ...newProfile, _id: result.insertedId },
      });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
}

export default Profile;
