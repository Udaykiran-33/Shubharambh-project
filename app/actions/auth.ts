'use server';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const phone = formData.get('phone') as string;
  const role = (formData.get('role') as 'user' | 'vendor') || 'user';

  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return { error: 'Email already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role,
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
