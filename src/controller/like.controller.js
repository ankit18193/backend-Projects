import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import { response } from 'express';
import { Like } from '../models/like.model.js';
import { Dislike } from '../models/dislike.model.js';

const togglelike = asynchandler(async (req, res) => {
  const { id, type } = req.query;
  ; //type:-video,comment,reply ** id:-videoId,commentId,replyId
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'invalid id ');
  }
  if (!['video', 'comment', 'reply'].includes(type)) {
    throw new ApiError(400, 'invalid like type');
  }

  let likeQuery = {};
  let dislikeQuery = {};

  switch (type) {
    case 'video':
      likeQuery = { onVideo: id, likedBy: userId };
      dislikeQuery = { onVideo: id, dislikedBy: userId };

      break;
    case 'comment':
      likeQuery = { onComment: id, likedBy: userId };
      dislikeQuery = { onComment: id, dislikedBy: userId };

      break;
    case 'reply':
      likeQuery = { onReply: id, likedBy: userId };
      dislikeQuery = { onReply: id, dislikedBy: userId };

      break;

    default:
      break;
  }
  let message = '';

  const existingLike = await Like.findOne(likeQuery);
  if (!existingLike) {
    await Like.create(likeQuery);
    message = `liked ${type}`;
    await Dislike.deleteOne(dislikeQuery);
  } else {
    await Like.findByIdAndDelete(existingLike._id);
    message = `Like Remove from ${type}`;
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});

export { togglelike };
