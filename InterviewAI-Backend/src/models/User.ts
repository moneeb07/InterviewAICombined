import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/User';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

export const User = mongoose.model<IUser>('User', userSchema, 'user');
