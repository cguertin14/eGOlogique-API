import UserController from './../controllers/userController';
import { bearer } from './../middlewares/authenticate';
import express from 'express';
import { body, check } from 'express-validator/check';
const router = express.Router();

router.post('/', async (req, res) => {
    await new UserController(req, res).signUp();
});

router.get('/me', bearer, (req, res) => {
    new UserController(req, res).me();
});

router.get('/leaderboard', bearer, async (req, res) => {
    await new UserController(req, res).leaderBoard();
});

router.post('/login', async (req, res) => {
    await new UserController(req, res).logIn();
});

router.delete('/logout', bearer, async (req, res) => {
    await new UserController(req, res).logOut();
});

export default router;