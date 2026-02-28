'use server';

import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function getUserProfile() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    await dbConnect();
    
    const user = await User.findById(session.user.id)
      .select('-password')
      .lean();

    if (!user) return null;

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

export async function updateUserProfile(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: 'Please login to update profile' };
  }

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  if (!name) {
    return { error: 'Name is required' };
  }

  try {
    await dbConnect();
    
    await User.findByIdAndUpdate(session.user.id, {
      name,
      phone,
    });

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error('Update profile error:', error);
    return { error: 'Failed to update profile' };
  }
}
