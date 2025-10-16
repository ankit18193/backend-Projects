import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken=async(userId)=>{
 try {
   const user=await User.findById(userId);
   const accessToken=user.generateAccessToken();
   const refreshToken=user.generateRefreshToken();
 
   user.refreshToken=refreshToken
   await user.save({validateBeforeSave:false})
 
   return {accessToken,refreshToken}
 } catch (error) {
  throw new ApiError(500,"somthing went wrong while generating the access and refresh tokens")

  
 }
}

const registerUser = asynchandler(async (req, res) => {
  // get user details from frontend
  // validation checks: not empty
  // check user already exists: username,eamil
  // check image uploads:avatar
  // upload them to cloudinary,get the url
  // create an user object-create a bd entry
  // remove password and refresh token feild from response
  // check for user creation
  // return response

  // res.status(200).json({
  //     message:"Registration completed"

  // })

  //using .some method

  const { fullname, email, password, username } = req.body;
  if ([fullname, username, password, email].some((feild) => feild?.trim() === '')) {
    throw new ApiError(400, 'all feilds are required ');
  }
  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(409, 'User with eamil or Username is already exist!');
  }

  const avatarlocalPath = req.files?.avatar[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage[0]?.path;

let coverImageLocalPath;

if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
  coverImageLocalPath=req.files.coverImage[0].path;
}

  if (!avatarlocalPath) {
    throw new ApiError(409, 'Avatar is Required!');
  }

  const avatar = await uploadCloudinary(avatarlocalPath);
  const coverImage= await uploadCloudinary(coverImageLocalPath);
  

  if (!avatar) {
    throw new ApiError(400, 'AVATAR is Required!');
  }

  const user = await User.create({
    fullname,
    avatar: avatar.secure_url,
    coverImage: coverImage?.url || '',
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  if (!createdUser) {
    throw new ApiError(500, 'somthing went wrong while registering the user');
  }

  return res.status(201).json(new ApiResponse(200, createdUser, 'user registered succesfully!'));
});

const loginUser=asynchandler(async (req,res)=>{

  // req.body->user data 
  // username,email
  // find the user based on data exits or nor
  // password check
  // access token generate 
  //send cookie 
  //return a response 



  const {username,email,password}=req.body;
  
  if(!(username || email) ){
    throw new ApiError(400,"username or eamil is required for login ")


  }

  const user=await User.findOne({
    $or:[{email},{username}]
  })

  if(!user){
    throw new ApiError(404,"user does not exist ")
  }
   const isPasswordValid=await user.isPasswordCorrect(password)
  
   if(!isPasswordValid){
    throw new ApiError(401,"password is incorrect!")
  }
   
  const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

  const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "user logged in successfully"
    )
  )

});

const logoutUser=asynchandler(async (req,res)=>{
await User.findByIdAndUpdate(
  req.user._id,
  {
    $set:{
      refreshToken:undefined
    }
  },
  {
    new:true
  }
)

const options={
    httpOnly:true,
    secure:true
  }
 return res
 .status(200)
 .clearCookie("accessToken",options)
 .clearCookie("refreshToken",options)
 .json(new ApiResponse(
  200,
  {

  },
  "user logged out successfully"
 ))

})

const refreshAccessToken =asynchandler(async (req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
  }

  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
    const user=await User.findById(decodedToken._id)
  
    if(!user){
      throw new ApiError(402,"Invalid user")
    }
  
    if(incomingRefreshToken !== user){
      throw new ApiError(403,"Refresh token is expired")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {newRefreshToken,accessToken}=await generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
      {
        accessToken,refreshToken:newRefreshToken
      },
      "Refresh token Refreshed successfully"
      )
    )
  } catch (error) {
    throw new ApiError(400, error?.message || "invalid refresh token ")
  }

})

export { registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
 };
