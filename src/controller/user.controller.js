import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

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

export { registerUser };
