import express from "express";
import AuthController from "../Controladores/PostLogin";
import Cadastro from "../Controladores/Cadastro";
import RedefinicaoSenha from "../Controladores/RecuperaçãoSenha";
import EmailController from "../Controladores/PostResetSenha";
import { authenticateToken } from "../Controladores/authMiddleware";
import Alimentos from "../Controladores/AlimentosController";

const router = express.Router();

const authController = new AuthController();
const cadastro = new Cadastro();
const redefinicaoSenha = new RedefinicaoSenha();
const emailController = new EmailController();
const alimentosController = new Alimentos(); //rota adicionada para procurar dados no banco;

// Definindo a rota para buscar alimentos
router.post('/buscar-alimento', alimentosController.Find);

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

// Exemplo de rota protegida com autenticação JWT
//router.post("/login", authenticateToken, authController.login);

export default router;
