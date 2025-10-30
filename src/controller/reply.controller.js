import mongoose from 'mongoose';
import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Comment } from '../models/comment.model.js';
import { Reply } from '../models/reply.model.js';

const addReply = asynchandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!content?.trim()) throw new ApiError(400, 'Reply content is required');
  if (!mongoose.Types.ObjectId.isValid(commentId)) throw new ApiError(400, 'Invalid comment ID');

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const newReply = await Reply.create({
    repliedBy: userId,
    onComment: commentId,
    content,
  });

  if (!newReply) throw new ApiError(500, 'Failed to add reply');

  return res
  .status(201)
  .json(new ApiResponse
    (201,
    { newReply },
    'Reply added successfully'));
});

export { addReply };
