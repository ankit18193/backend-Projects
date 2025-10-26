import { Router } from "express";
import { toggleDislike } from "../controller/dislike.controller.js"; 
import { verifyJwt } from '../middleware/auth.middleware.js';

const router=Router()

router.route("/toggle").post(verifyJwt,toggleDislike)

export default router
