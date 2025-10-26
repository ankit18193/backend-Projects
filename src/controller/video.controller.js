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

export {uploadVideo}