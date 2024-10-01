import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import pool from "./db";
import { User } from "../types/custom";
import jwt from "jsonwebtoken"; // Import jwt here

dotenv.config();

const DB_NAME = process.env.DB_NAME!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL!;

class GoogleAuthController {
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
      (err: any, user: User | false | undefined) => {
        if (err || !user) {
          return res.redirect("/login");
        }

        const token = jwt.sign(
          { id: user._id!.toString() },
          process.env.SECRET_KEY!,
          {
            expiresIn: "1h",
          }
        );

        res.redirect(
          `${FRONTEND_URL}/?token=${token}&userId=${user._id!.toString()}`
        );
      }
    )(req, res);
  }
}

export default GoogleAuthController;
