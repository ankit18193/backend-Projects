import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"

const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    (req, res, next) => {
    console.log(req.files); 
    next();                
  },
    registerUser)




export default router