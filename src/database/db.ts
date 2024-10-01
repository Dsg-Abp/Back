import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL;

if (!MONGO_URI) {
  throw new Error("A variável de ambiente DATABASE_URL não está definida.");
}

const client = new MongoClient(MONGO_URI);

client.connect().then(() => {
  console.log("Conectado ao MongoDB com sucesso!");
});

export default client;
