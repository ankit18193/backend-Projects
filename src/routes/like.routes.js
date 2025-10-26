import { Router } from "express";
import { togglelike } from "../controller/like.controller.js";
import { verifyJwt } from '../middleware/auth.middleware.js';

const router=Router()

router.route("/toggle").post(verifyJwt,togglelike)

export default router
