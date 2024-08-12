import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import pool from "./db";
dotenv.config();

const DB_NAME = process.env.DB_NAME;

class EmailController {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async enviarEmailDeRecuperacao(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email não fornecido" });
    }

    const client: MongoClient = await pool.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection("login");

    // Verifica se o usuário existe
    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const { recoveryCode } = user;

    if (!recoveryCode) {
      return res
        .status(400)
        .json({ error: "Código de recuperação não encontrado" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Recuperação de Senha",
      text: `Olá!

              Você solicitou a recuperação de senha para acessar o aplicativo Burnfit. Para redefinir sua senha, por favor, use o código a seguir:

              ${recoveryCode}

              Se você não fez essa solicitação, por favor, ignore este e-mail.

              Obrigado,
              Equipe Burnfit `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      res
        .status(200)
        .json({ message: "Email de recuperação enviado com sucesso" });
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      res.status(500).json({ error: "Erro ao enviar email de recuperação" });
    }
  }
}

export default EmailController;
