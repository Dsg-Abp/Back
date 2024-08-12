import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import router from "./Rotas";
import client from "./Controladores/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para suportar JSON no corpo da requisição
app.use(express.json());

// Middleware para permitir requisições de qualquer domínio
app.use(cors());

// Testando a conexão com o MongoDB remoto
client
  .connect()
  .then(() => console.log("Conectado ao banco de dados."))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

app.use(router);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
