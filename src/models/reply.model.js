import mongoose, { Schema } from "mongoose";
import { Video } from "./video.model.js";
import { User } from "./user.model.js";

import { Comment } from "./comment.model.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const replySchema=new Schema({

    repliedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"

    },

    onComment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },

    content:{
        type:String,
        required:true,
    },
   
   



},{timestamps:true})

replySchema.plugin(mongooseAggregatePaginate)
export const Reply=mongoose.model("Reply",replySchema)