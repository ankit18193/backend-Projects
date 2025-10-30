import { Router } from "express";
import { addReply } from "../controller/reply.controller.js"; 
import { verifyJwt } from '../middleware/auth.middleware.js';

const router = Router();



router.route("/add/:commentId").post(verifyJwt,addReply);

export default router;