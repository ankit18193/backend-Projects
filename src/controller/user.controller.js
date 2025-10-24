import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'somthing went wrong while generating the access and refresh tokens');
  }
};

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

  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarlocalPath) {
    throw new ApiError(409, 'Avatar is Required!');
  }

  const avatar = await uploadCloudinary(avatarlocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

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

const loginUser = asynchandler(async (req, res) => {
  // req.body->user data
  // username,email
  // find the user based on data exits or nor
  // password check
  // access token generate
  //send cookie
  //return a response

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, 'username or eamil is required for login ');
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, 'user does not exist ');
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'password is incorrect!');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'user logged in successfully'
      )
    );
});

const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'user logged out successfully'));
});

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(402, 'Invalid user');
    }

    if (incomingRefreshToken !== user) {
      throw new ApiError(403, 'Refresh token is expired');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { newRefreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          'Refresh token Refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || 'invalid refresh token ');
  }
});

const changePassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword, cnfPassword } = req.body;

  if (!(newPassword === cnfPassword)) {
    throw new ApiError(400, 'New password and confirm password do not match');
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Old password is incorrect');
  }
  if (oldPassword === newPassword) {
    throw new ApiError(403, 'New password cannot be same as old password');
  }

  user.password = newPassword;
  //  await user.save({validateBeforeSave:false})
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'password changed successfully'));
});

const getCurrentUser = asynchandler(async (req, res) => {
  return res.status(200).json(200, req.user, 'current duer fetched successfully');
});

const updateFullname = asynchandler(async (req, res) => {
  // 1.short approach

  const { fullname } = req.body;

  if (!fullname || fullname.trim() === '') {
    throw new ApiError(403, 'fullname not recieved!');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname.trim(),
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'user not found');
  }

  return res.status(200).json(new ApiResponse(200, { user }, 'fullname updated successfully'));

  // 2.long approach
  // const {fullname}=req.body

  // if(!fullname || fullname.trim()===""){
  //   throw new ApiError(400,"full name not recived")
  // }

  // const user=await User.findById(req.user?._id);
  // if(!user){
  //   throw new ApiError(400,"user not found")
  // }

  // user.fullname=fullname.trim()
  // await user.save()

  // const updateduser=await User.findById(req.user?._id).select("-password -refreshToken")

  // return res
  // .status(200)
  // .json({
  //   statusCode:200,
  //   data:updateduser,
  //   message:"user full name updated successfully"
  // }
  // )
});

const updateEmail = asynchandler(async (req, res) => {
  const { newEmail } = req.body;

  if (!newEmail || newEmail.trim() === '') {
    throw new ApiError(401, 'new email is required!');
  }

  const newNormalizedEmail = newEmail.trim().toLowerCase();

  const existedUser = await User.findOne({ email: newNormalizedEmail });
  if (existedUser) {
    if (existedUser.email === req.user.email) {
      throw new ApiError(400, 'Your new email cannot be the same as your current one.');
    } else {
      throw new ApiError(402, 'this email is already existed,try new!');
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        email: newNormalizedEmail,
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedUser }, 'your email updated succesfully !'));
});

const updateAvatar = asynchandler(async (req, res) => {
  const avatarlocalPath = req.file?.path;

  if (!avatarlocalPath) {
    throw new ApiError(400, 'Avatar file not uploaded');
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);

  if (!avatar.url) {
    throw new ApiError(402, 'error while uploading the avatar file !');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  return res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar is updated succesfully !'));
});

const updateCoverImg = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, 'cover image not uploaded');
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, 'error while uploading the cover image');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, 'cover image updated successfully!'));
});

const getUserChannelProfile = asynchandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, 'Username not fetched properly!');
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: '$subscribers',
        },
        channelSubscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, 'channel not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], ' user channel fetched successfully!'));
});

const getWatchHistory = asynchandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner:{
                $first: '$owner'
              }
            },
          },
        ],
      },
    },
  ]);

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully !"
    )
  )


});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateFullname,
  updateEmail,
  updateAvatar,
  updateCoverImg,
  getUserChannelProfile,
  getWatchHistory,
  
};
