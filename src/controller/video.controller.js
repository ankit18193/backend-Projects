import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import { Video } from '../models/video.model.js';
import { response } from 'express';
import { addComments } from './comments.controller.js';
import { Reply } from '../models/reply.model.js';


ffmpeg.setFfprobePath(ffprobeStatic.path);


const uploadVideo = asynchandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFilePath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0].path;

  if (!title || !description || !videoFilePath || !thumbnailPath) {
    throw new ApiError(400, 'All feilds are require!');
  }

 

  try {
    const getDuration = (filepath) =>
      new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filepath, (err, metadata) => {
          if (err) reject(err);
          else resolve(Math.round(metadata.format.duration));
        });
      });

    const duration = await getDuration(videoFilePath);


    const videoFile = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!videoFile.url) {
      throw new ApiError(400, 'Error while uploading the video file on cloudinary');
    }

    if (!thumbnail.url) {
      throw new ApiError(400, 'Error while uploading the thumbnail on cloudinary');
    }

    const newVideo = new Video({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration,
      owner: req.user?._id,
    });

    await newVideo.save();

    return res.status(201).json(new ApiResponse(201, { newVideo }, 'video Uploaded successfully!'));
  } catch (error) {
    console.error(error);
    throw new ApiError(500, 'video uploading failed,');
  }
});

const getVideoDetails=asynchandler(async (req,res)=>{
  const {videoId} = req.params
  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(404,"invalid video id")
  }
  if(!videoId.url){
    throw new ApiError(404,"video not received")
  }

  const comments=await Comment.find({
    onVideo: videoId
  }).select("_id")

  const commenstId=comments.map(c=>c._id)

  const replyConut=await Reply.countDocuments({
    onComment:{$in:commenstId}
  })
  const topLevelcommentsConut=commenstId.length;

  const totalComments=replyConut+topLevelcommentsConut



  const video=await Video.aggregate([
    {
      $match:{
        _id:videoId
      }
    },
    //stage 1(getting video owner Details)
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[
          {
            $project:{
              username:1,
              avatar:1
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          },
          
          {
            $lookup:{
              from:"subscriptions",
              localField:"_id",
              foreignField:"channel",
              as:"subscribers",
              pipeline:[
                {
                  $addFields:{
                    subscribersCount:{
                      $size:"$subscribers"
                    }

                  }
                }
              ]
            }
          },
          
        ]

      }
    },
    {
      $lookup:{
        from:"likes",
        localField:"_id",
        foreignField:"onVideo",
        as:"likes",
        pipeline:[
          {
            $addFields:{
              likesCount:{
                $size:"$likes"
              }
            }
          }
        ]
      }
    },
    {
      $lookup:{
        from:"dislikes",
        localField:"_id",
        foreignField:"onVideo",
        as:"dislikes",
        pipeline:[
          {
            $addFields:{
              dislikesCount:{
                $size:"$dislikes"
              }
            }
          }
        ]
      }
    },
    {
      $project:{
        title:1,
        description:1,
        likesCount:1,
        dislikesCount:1,
        subscribersCount:1,
        owner:1,
      }
    }
    

  ])

  if(!video){
    throw new ApiError(505,"could not fetch the video")
  }

  


})

export {uploadVideo,getVideoDetails}