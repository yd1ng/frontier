import mongoose, { Document, Schema } from 'mongoose';

export interface IRecruit extends Document {
  title: string;
  content: string;
  category: 'ctf' | 'project' | 'study';
  author: mongoose.Types.ObjectId;
  status: 'recruiting' | 'closed';
  maxMembers: number;
  currentMembers: number;
  tags: string[];
  images: string[]; // 이미지 파일 경로 배열
  deadline?: Date;
  views: number;
  likes: mongoose.Types.ObjectId[];
  comments: IRecruitComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecruitComment {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const RecruitCommentSchema = new Schema<IRecruitComment>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const RecruitSchema = new Schema<IRecruit>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['ctf', 'project', 'study'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['recruiting', 'closed'],
      default: 'recruiting',
    },
    maxMembers: {
      type: Number,
      required: true,
      min: 1,
    },
    currentMembers: {
      type: Number,
      default: 1,
      min: 1,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [RecruitCommentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRecruit>('Recruit', RecruitSchema);

