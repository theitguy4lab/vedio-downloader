import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  storageUsageBytes: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultFormat?: string;
    defaultQuality?: string;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  hashPassword(password: string): Promise<string>;
}

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    storageUsageBytes: {
      type: Number,
      default: 0,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark',
      },
      defaultFormat: {
        type: String,
        default: 'mp4',
      },
      defaultQuality: {
        type: String,
        default: '1080p',
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.statics.hashPassword = async function (password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
