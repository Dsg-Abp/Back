import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import pool from "../database/db";

dotenv.config();

const DB_NAME = process.env.DB_NAME;

class Profile {
  async saveProfile(req: Request, res: Response) {
    const { nome, peso, altura, genero, dataNascimento, userId, imc } =
      req.body;

    if (
      !nome ||
      !peso ||
      !altura ||
      !genero ||
      !dataNascimento ||
      !userId ||
      !imc
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection("profile");

      const existingProfile = await collection.findOne({ userId });

      if (existingProfile) {
        const updatedProfile = {
          imc,
          nome,
          peso,
          altura,
          genero,
          dataNascimento,
          updatedAt: new Date(),
        };

        await collection.updateOne({ userId }, { $set: updatedProfile });

        res.status(200).json({
          message: "Perfil atualizado com sucesso",
          profile: { ...existingProfile, ...updatedProfile },
        });
      } else {
        const newProfile = {
          imc,
          userId,
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
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
  //
  async getProfile(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "O userId é obrigatório" });
    }

    let client: MongoClient | null = null;

    try {
      client = await pool.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection("profile");

      const profile = await collection.findOne({ userId });

      if (profile) {
        res.status(200).json({ profile });
      } else {
        res.status(404).json({ message: "Perfil não encontrado" });
      }
    } catch (error) {
      console.error("Erro ao obter perfil:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
}

export default Profile;
