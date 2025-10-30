import mongoose from "mongoose";
import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";

const addComments = asynchandler(async (req, res) => {
  
  const { content } = req.body;
  const { videoId } = req.params;
  const userId = req.user._id;

  
  if (!content) {
    throw new ApiError(400, 'Comment content is required');
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid Video ID');
  }

  
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  
  const newComment = await Comment.create({
    content: content,
    onVideo: videoId,     
    commentedBy: userId,
  });

  if (!newComment) {
    throw new ApiError(500, 'Failed to add comment, please try again');
  }

  
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { newComment },
        'Comment added successfully!'
      )
    );
});

export { addComments };