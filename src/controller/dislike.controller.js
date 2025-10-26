import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

import { ApiResponse } from '../utils/apiResponse.js';

import mongoose from 'mongoose';
import { Like } from '../models/like.model.js';
import { Dislike } from '../models/dislike.model.js';

const toggleDislike = asynchandler(async (req, res) => {
  const { id, type } = req.query;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'invalid id');
  }
  if (!['video', 'comment', 'reply'].includes(type)) {
    throw new ApiError(404, 'invalid dislike type');
  }

  let likeQuery = {};
  let dislikeQuery = {};

  switch (type) {
    case 'video':
      dislikeQuery = { onVideo: id, dislikedBy: userId };
      likeQuery = { onVideo: id, likedBy: userId };

      break;
    case 'comment':
      dislikeQuery = { onComment: id, dislikedBy: userId };
      likeQuery = { onComment: id, likedBy: userId };

      break;
    case 'video':
      dislikeQuery = { onReply: id, dislikedBy: userId };
      likeQuery = { onReply: id, likedBy: userId };

      break;

    default:
      break;
  }

  const existingDislike = await Dislike.findOne(dislikeQuery);
  let message = '';

  if (!existingDislike) {
    await Dislike.create(dislikeQuery);
    message = `dislike ${type}`;
    await Like.deleteOne(likeQuery);
  } else {
    await Dislike.findByIdAndDelete(existingDislike._id);
    message = `Dislike removed from ${type}`;
  }

  return res.status(201).json(new ApiResponse(201, {}, message));
});

export { toggleDislike };
