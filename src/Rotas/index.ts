import express from "express";
import AuthController from "../Controladores/PostLogin";
import Cadastro from "../Controladores/Cadastro";
import RedefinicaoSenha from "../Controladores/RecuperaçãoSenha";
import EmailController from "../Controladores/PostResetSenha";
import { authenticateToken } from "../Controladores/authMiddleware";
import Alimentos from "../Controladores/AlimentosController";
import HealthPass from "../Controladores/healthPass";
import Profile from "../Controladores/Profile";

import Agua from "../Controladores/UpWater";

const router = express.Router();

const authController = new AuthController();
const cadastro = new Cadastro();

//parte da agua
const agua = new Agua();


const redefinicaoSenha = new RedefinicaoSenha();
const emailController = new EmailController();
const alimentosController = new Alimentos();
const newProfile = new Profile();

// Definindo a rota para buscar alimentos
router.post("/buscar-alimento", alimentosController.Find);
const healthPass = new HealthPass();

// Rota de login
router.post("/login", authController.login);

//rota de insercao de agua
router.post("/agua", agua.registera);
router.post("/listagua", agua.FindAgua);
router.get("/teste", agua.findTeste);
router.post("/insert", agua.upTest);

// Rota de cadastro de usuário (registro)
router.post("/register", cadastro.register);

// Rota para salvar os dados do perfil//
router.post("/profile", newProfile.saveProfile);

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

export default router;
