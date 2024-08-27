import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import passport from "passport";
import pool from "./db";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";

import { User } from "../types/custom";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const DB_NAME = process.env.DB_NAME!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL!;

class AuthController {
  constructor() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: VerifyCallback
        ) => {
          try {
            const client: MongoClient = pool;
            const db = client.db(DB_NAME);
            const collection = db.collection<User>("login");

            let user = await collection.findOne({ googleId: profile.id });

            if (!user) {
              const newUser: Omit<User, "_id"> = {
                googleId: profile.id,
                email: profile.emails?.[0].value,
                nome: profile.displayName,
                accessToken,
                refreshToken,
              };

              const result = await collection.insertOne(newUser);
              user = await collection.findOne({ _id: result.insertedId });
            } else {
              await collection.updateOne(
                { _id: user._id },
                { $set: { accessToken, refreshToken } }
              );
            }

            done(null, user || undefined);
          } catch (error) {
            done(error);
          }
        }
      )
    );

    passport.serializeUser((user: Express.User, done) => {
      done(null, (user as User)._id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const client: MongoClient = pool;
        const db = client.db(DB_NAME);
        const collection = db.collection<User>("login");

        const user = await collection.findOne({ _id: new ObjectId(id) });
        done(null, user || undefined);
      } catch (error) {
        done(error);
      }
    });
  }

  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    try {
      const client: MongoClient = pool;
      const db = client.db(DB_NAME);
      const collection = db.collection<User>("login");

      const user = await collection.findOne({ email });

      if (user && user.senha && bcrypt.compareSync(senha, user.senha)) {
        const { senha, ...userWithoutPassword } = user;
        const token = jwt.sign(
          { id: userWithoutPassword._id!.toString() },
          SECRET_KEY,
          {
            expiresIn: "1h",
          }
        );

        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } catch (error) {
      console.error("Erro:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  googleLogin(req: Request, res: Response) {
    passport.authenticate("google", {
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.activity.write",
        "https://www.googleapis.com/auth/fitness.body.read",
        "https://www.googleapis.com/auth/fitness.body.write",
      ],
    })(req, res);
  }

  googleCallback(req: Request, res: Response) {
    passport.authenticate(
      "google",
      (err: any, user: User | false | undefined, info: any) => {
        if (err || !user) {
          return res.redirect("/login");
        }

        const token = jwt.sign({ id: user._id!.toString() }, SECRET_KEY, {
          expiresIn: "1h",
        });

        res.redirect(`${FRONTEND_URL}/?token=${token}`);
      }
    )(req, res);
  }
}

export default AuthController;
