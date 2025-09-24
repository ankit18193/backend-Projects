import mongoose, { Schema, SchemaType } from "mongoose";
import { Video } from "./video.model";
import jwt from "jsonwebtoken";
import bryct from "bcrypt"

const userSchema = new Schema({
   username: {
    type: String,
    required: true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true,
    },

   email: {
    type: String,
    required: true,
    unique:true,
    lowercase:true,
    trim:true,
    },

   avatar: {
    type: String,
    required: true,

    },

   coverImage: {
    type: String,

    },
   watchHistory: [
    {
        type:Schema.types.objectId,
        ref:"Video"
    }
   ],

   password:{
    type:String,
    required:[true,"password is required"]

   },

   refreshToken:{
    type:String,
    required:true,
   },
 
},{timestamps:true})

userSchema.pre("save",function(next){
    if(!this.isModified("password")) return next();
    this.password=bcrypt.hash(this.password,10)
    (next)
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
   jwt.sign(
    {
        _id:this.id,
        email:this.email,
        fullName:this.fullName,
        username:this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
   )
}
userSchema.methods.generateRefreshToken=function(){
    jwt.sign(
    {
        _id:this.id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
   )
}

export const User=mongoose.model("User",userSchema)