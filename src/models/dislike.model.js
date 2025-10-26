import mongoose, { Schema } from "mongoose";
import { User } from "./user.model.js";
import { Video } from "./video.model.js";
import { Comment } from "./comment.model.js";
import { Reply } from "./reply.model.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const dislikeSchema=new Schema({
    dislikedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },

    onVideo:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    onComment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    onReply:{
        type:Schema.Types.ObjectId,
        ref:"Reply"
    }



},{timestamps:true})



dislikeSchema.plugin(mongooseAggregatePaginate)
export const Dislike=mongoose.model("Dislike",dislikeSchema)