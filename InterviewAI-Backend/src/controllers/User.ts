import { Request, Response } from 'express';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { asyncErrorHandler } from '../middlewares/error-handling.middleware';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types/Requests';

interface SupabaseAuthUser {
  id: string;
  email: string;
  record: {
    email: string;
    raw_user_meta_data: {
      role?: 'candidate' | 'interviewer';
      name?: string;
    };
    email_confirmed_at: string;
  };
}

/**
 * Create a new user from Supabase auth.users
 */
export const createUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const authUser = req.body as SupabaseAuthUser;
  
  // If the email confirmed is null we will return an error
  if (!authUser?.record?.email_confirmed_at) {
    return res.status(400).json({
      message: 'Email is not confirmed'
    });
  }

  console.log('Incoming user data: ', authUser);


  if (!authUser?.record?.email) {
    return res.status(400).json({
      message: 'Email is required in payload'
    });
  }
  
  const { record } = authUser;

  // Default to 'candidate' if role is not present in meta data
  const email = record.email

  // Get the name from the meta data
  const name = record?.raw_user_meta_data?.name || 'Unknown';

  try {
      console.log("Creating the user");
      // Create the user
      const user = await new User({
        email: email,
        name: name
      }).save();

    return res.status(201).json({
      message: 'User created successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error creating user' + error
    });
  }
});

/**
 * Get user by email
 */
export const getUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  return res.status(200).json({
    status: 'success',
  });
});

export const getUserByEmail = asyncErrorHandler(async (req: Request, res: Response) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({
      status: 'error',
      code: 'MISSING_EMAIL',
      message: 'Email is required'
    });
  }
  
  const user = await User.findOne({ email: email.trim() });
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      code: 'USER_NOT_FOUND',
      message: 'User not found'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const updateUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const authUser = req.body as SupabaseAuthUser;

  const userMetadata = authUser.record?.raw_user_meta_data;

  // Get the name from the meta data
  const name = userMetadata?.name;

  if (!name) {
    return res.status(400).json({
      message: 'Name is required in payload'
    });
  }

  const user = await User.findOne({ email: authUser.record?.email });

  if (!user) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  // Update the user's name
  user.name = name;
  await user.save();

  return res.status(200).json({
    message: 'User updated successfully'
  });
});

export const deleteUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const authUser = req.body as SupabaseAuthUser;

  const user = await User.findOne({ email: authUser.record?.email });

  if (!user) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  await user.deleteOne();

  return res.status(200).json({
    message: 'User deleted successfully'
  });
});

/**
 * Update user details - users can only update their own profile
 */
export const updateUserDetails = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const authenticatedUserId = req.user._id;
  
  // Check if valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_ID',
      message: 'Invalid user ID format'
    });
  }
  
  // Verify user is updating their own profile
  if (id !== authenticatedUserId.toString()) {
    return res.status(403).json({
      status: 'error',
      code: 'ACCESS_DENIED',
      message: 'You can only update your own profile'
    });
  }
  
  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_NAME',
      message: 'Name is required and must be a non-empty string'
    });
  }
  
  // Find the user and update
  const user = await User.findById(id);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      code: 'USER_NOT_FOUND',
      message: 'User not found'
    });
  }
  
  // Update the user's name
  user.name = name.trim();
  await user.save();
  
  return res.status(200).json({
    status: 'success',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email
    },
    message: 'User details updated successfully'
  });
});