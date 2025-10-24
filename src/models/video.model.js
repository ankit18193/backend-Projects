import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    views: 
      {
        type: Number,
        default: 0,
      },
    
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    disLikes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comment: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
        },
        likes: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        disLikes: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },

        replies: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: 'User',
            },
            text: {
              type: String,
              required: true,
            },
            likes: [
              {
                type: Schema.Types.ObjectId,
                ref: 'User',
              },
            ],
            disLikes: [
              {
                type: Schema.Types.ObjectId,
                ref: 'User',
              },
            ],
            createdAt: {
              type: Date,
              default: Date.now,
            },
            replies: [],
          },
        ],
      },
    ],

    isPublished: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);
