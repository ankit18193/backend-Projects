import { ApiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJwt = asynchandler(async (req,res,next) => {
   try {
    const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
 
    if(!token){
     throw new ApiError(401,"unauthorize request");
    }
 
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user=await User.findById(decodedToken._id).select("-password -refreshToken")
 
    if(!user){
     throw new ApiError(400,"invalid AccessToken")
    }
 
    req.user=user
    next();
   } catch (error) {
    throw new ApiError(401,"invalid access token")
    
   }

})
