// src/models/File.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    filename: string;      // 저장된 파일명 (UUID 포함)
    originalName: string;  // 사용자가 올린 원래 이름
    uploader: mongoose.Types.ObjectId; // 올린 사람 ID (핵심!)
    size: number;
    mimetype: string;
    createdAt: Date;
}

const FileSchema = new Schema<IFile>(
    {
        filename: { type: String, required: true, unique: true },
        originalName: { type: String, required: true },
        uploader: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        size: { type: Number, required: true },
        mimetype: { type: String, required: true },
    },
    { timestamps: true }
    );

export default mongoose.model<IFile>('File', FileSchema);