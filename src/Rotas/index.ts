import express from "express";
import AuthController from "../Controladores/PostLogin";
import Cadastro from "../Controladores/Cadastro";
import RedefinicaoSenha from "../Controladores/RecuperaçãoSenha";
import EmailController from "../Controladores/PostResetSenha";
import { authenticateToken } from "../Controladores/authMiddleware";
<<<<<<< HEAD
import Alimentos from "../Controladores/AlimentosController";
=======
import HealthPass from "../Controladores/healthPass";
>>>>>>> bd7db07353e8b2f82b9e8f6a665e0c0b74fc8157

const router = express.Router();

const authController = new AuthController();
const cadastro = new Cadastro();
const redefinicaoSenha = new RedefinicaoSenha();
const emailController = new EmailController();
<<<<<<< HEAD
const alimentosController = new Alimentos(); //rota adicionada para procurar dados no banco;

// Definindo a rota para buscar alimentos
router.post('/buscar-alimento', alimentosController.Find);
=======
const healthPass = new HealthPass();
>>>>>>> bd7db07353e8b2f82b9e8f6a665e0c0b74fc8157

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

export default router;
