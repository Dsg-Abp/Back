import express from "express";
import AuthController from "../Controladores/PostLogin"; // Normal login

import Cadastro from "../Controladores/Cadastro";
import RedefinicaoSenha from "../Controladores/RecuperaçãoSenha";
import EmailController from "../Controladores/PostResetSenha";
import { authenticateToken } from "../Controladores/authMiddleware";
import Alimentos from "../Controladores/AlimentosController";
import HealthPass from "../Controladores/healthPass";
import Profile from "../Controladores/Profile";
import WebCam from "../Controladores/WebCam";
import imcProfile from "../Controladores/getProfile";
import UserAlimentos from "../Controladores/UserAlimentosController";

import Agua from "../Controladores/UpWater";
import GoogleAuthController from "../Controladores/PostLoginGoogle";

const router = express.Router();
const imcdata = new imcProfile();
const authController = new AuthController();
const googleAuthController = new GoogleAuthController(); // Instantiate GoogleAuthController
const cadastro = new Cadastro();
const agua = new Agua();
const redefinicaoSenha = new RedefinicaoSenha();
const emailController = new EmailController();
const alimentosController = new Alimentos();
const newProfile = new Profile();
const photo = new WebCam();
const userAlimentos = new UserAlimentos();
router.get("/dataProfile/:userId", imcdata.getData);
// Definindo a rota para buscar alimentos
router.post("/buscar-alimento", alimentosController.Find);

router.post("/alimentosData", userAlimentos.insertData);
router.get("/alimentosData/:userId", userAlimentos.getData);

// Rota de login
router.post("/login", authController.login);

// Rota de autenticação com Google
router.get("/auth/google", googleAuthController.googleLogin); // Update to use GoogleAuthController

// Rota de callback do Google
router.get(
  "/auth/google/callback",
  (req, res) => googleAuthController.googleCallback(req, res) // Update to use GoogleAuthController
);

// Rota de inserção de água
router.post("/agua", agua.registera);
router.post("/listagua", agua.FindAgua);
router.get("/teste", agua.findTeste);
router.post("/insert", agua.upTest);

// Rota de cadastro de usuário (registro)
router.post("/register", cadastro.register);

// Rota para salvar os dados do perfil
router.post("/profile", newProfile.saveProfile);

// Rota de recuperação de senha
router.post("/recuperacao-senha", redefinicaoSenha.resetPassword);

// Rota de envio de email de recuperação
router.post("/reset", (req, res) =>
  emailController.enviarEmailDeRecuperacao(req, res)
);

// Rota para obter os dados do perfil usando o userId
router.get("/profile/:userId", newProfile.getProfile);

// Rota para salvar foto da webcam
router.post("/web", photo.savePhoto);
router.get("/web", photo.getCam);

export default router;
