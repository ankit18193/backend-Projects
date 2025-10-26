import mongoose, { Schema } from "mongoose";
import { Video } from "./video.model.js";
import { User } from "./user.model.js";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema=new Schema({

    commentedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"

    },

    onVideo:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },

    content:{
        type:String,
        required:true,
    },
   

},{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comment",commentSchema)