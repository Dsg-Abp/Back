import express from "express";
import AuthController from "../Controladores/PostLogin";
import Cadastro from "../Controladores/Cadastro";
import RedefinicaoSenha from "../Controladores/RecuperaçãoSenha";
import EmailController from "../Controladores/PostResetSenha";
import { authenticateToken } from "../Controladores/authMiddleware";
import HealthPass from "../Controladores/healthPass";
import GetHealthPass from "../Controladores/getHealthPass";

const router = express.Router();

const authController = new AuthController();
const cadastro = new Cadastro();
const redefinicaoSenha = new RedefinicaoSenha();
const emailController = new EmailController();
const healthPass = new HealthPass();
const getHealthPass = new GetHealthPass();

// Rota de login
router.post("/login", authController.login);

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
