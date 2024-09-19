import express from "express";
import AuthController from "../Controladores/PostLogin";
import Cadastro from "../Controladores/Cadastro";
import RedefinicaoSenha from "../Controladores/RecuperaçãoSenha";
import EmailController from "../Controladores/PostResetSenha";
import { authenticateToken } from "../Controladores/authMiddleware";
import Alimentos from "../Controladores/AlimentosController";
import HealthPass from "../Controladores/healthPass";
import GetHealthPass from "../Controladores/getHealthPass";

import Agua from "../Controladores/UpWater";

const router = express.Router();

const authController = new AuthController();
const cadastro = new Cadastro();

//parte da agua
const agua = new Agua();


const redefinicaoSenha = new RedefinicaoSenha();
const emailController = new EmailController();
const alimentosController = new Alimentos(); //rota adicionada para procurar dados no banco;

// Definindo a rota para buscar alimentos
router.post('/buscar-alimento', alimentosController.Find);
const healthPass = new HealthPass();
const getHealthPass = new GetHealthPass();

// Rota de login
router.post("/login", authController.login);

//rota de insercao de agua
router.post("/agua", agua.registera);
router.post("/listagua", agua.FindAgua);
router.get("/teste", agua.findTeste);

// Rota de cadastro de usuário (registro)
router.post("/register", cadastro.register);

// Rota de recuperação de senha
router.post("/recuperacao-senha", redefinicaoSenha.resetPassword);

// Rota de envio de email de recuperação
router.post("/reset", (req, res) =>
  emailController.enviarEmailDeRecuperacao(req, res)
);

// Rota para autenticação com Google
router.get("/auth/google", authController.googleLogin);

// Rota de callback do Google
router.get("/auth/google/callback", (req, res) =>
  authController.googleCallback(req, res)
);

// Rota para obter contagem de passos
router.get("/user/:userId/step-count", (req, res) =>
  healthPass.getStepCount(req, res)
);

//Rota para trazer da coleção instatanea -  somar e exibir por dia.
router.get("/user/:userId/steps-today", (req, res) =>
  getHealthPass.getStepCount(req, res)
);

export default router;
