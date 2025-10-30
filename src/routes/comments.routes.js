import { Router } from "express";
import { addComments } from "../controller/comments.controller.js"; 
import { verifyJwt } from '../middleware/auth.middleware.js';

const router = Router();



router.route("/add/:videoId").post(verifyJwt,addComments);

export default router;