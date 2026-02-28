'use server';

import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Venue from '@/models/Venue';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import { sendMail } from '@/lib/mailer';
import { appointmentRequestEmail } from '@/lib/emailTemplates';

export async function createAppointment(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Please login to book an appointment' };
  }

  const venueId = formData.get('venueId') as string;
  const type = formData.get('type') as 'appointment' | 'visit';
  const scheduledDate = formData.get('scheduledDate') as string;
  const scheduledTime = formData.get('scheduledTime') as string;
  const eventType = formData.get('eventType') as string;
  const attendees = parseInt(formData.get('attendees') as string);
  const notes = formData.get('notes') as string;
  const phone = formData.get('phone') as string;

  if (!venueId || !type || !scheduledDate || !scheduledTime || !eventType) {
    return { error: 'Please fill all required fields' };
  }

  try {
    await dbConnect();

    // Get venue and vendor info
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return { error: 'Venue not found' };
    }
    
    console.log('[createAppointment] Creating appointment for venue:', venue._id.toString(), 'vendorId:', venue.vendorId?.toString());

    // Get user info
    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: 'User not found' };
    }

    // Create appointment with user contact details (exclusive lead)
    const appointment = await Appointment.create({
      userId: session.user.id,
      vendorId: venue.vendorId,
      venueId: venue._id,
      type,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      eventType,
      attendees: attendees || 1,
      notes,
      contactShared: true,
      userName: user.name,
      userEmail: user.email,
      userPhone: phone || user.phone || '',
      status: 'pending',
    });
    
    console.log('[createAppointment] Appointment created:', appointment._id.toString(), 'Status:', appointment.status);

    // ── Send vendor notification email ─────────────────────────────────────────
    try {
      const vendor = venue.vendorId
        ? await Vendor.findById(venue.vendorId).lean() as any
        : null;

      if (vendor?.email) {
        const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vendor-dashboard`;
        const formattedDate = new Date(scheduledDate).toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        const html = appointmentRequestEmail({
          vendorName: vendor.name || vendor.businessName,
          businessName: vendor.businessName,
          userName: user.name,
          userEmail: user.email,
          appointmentType: type,
          scheduledDate: formattedDate,
          scheduledTime,
          eventType,
          attendees: attendees || 1,
          notes,
          venueName: venue.name,
          dashboardUrl,
        });

        await sendMail({
          to: vendor.email,
          subject: `📅 New ${type === 'visit' ? 'Site Visit' : 'Appointment'} Request from ${user.name} – Shubharambh`,
          html,
        });
        console.log('[createAppointment] Vendor email notification sent to:', vendor.email);
      }
    } catch (emailError) {
      // Non-blocking — log but don’t fail the booking
      console.error('[createAppointment] Failed to send vendor email notification:', emailError);
    }

    return {
      success: true,
      message: type === 'appointment' 
        ? 'Appointment booked successfully! The venue will contact you shortly.'
        : 'Visit scheduled successfully! The venue will contact you to confirm.',
      appointmentId: appointment._id.toString(),
    };
  } catch (error) {
    console.error('Appointment error:', error);
    return { error: 'Failed to book appointment. Please try again.' };
  }
}

export async function getUserAppointments() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    await dbConnect();

    // Only show confirmed, rejected, completed, or cancelled appointments
    // Pending appointments should only be visible to vendors
    const appointments = await Appointment.find({ 
      userId: session.user.id,
      status: { $in: ['confirmed', 'rejected', 'completed', 'cancelled'] }
    })
      .populate('venueId', 'name images location')
      .sort({ scheduledDate: -1 })
      .lean();

    return JSON.parse(JSON.stringify(appointments));
  } catch (error) {
    console.error('Get appointments error:', error);
    return [];
  }
}

export async function cancelAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Please login' };
  }

  try {
    await dbConnect();

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: session.user.id,
    });

    if (!appointment) {
      return { error: 'Appointment not found' };
    }

    await Appointment.findByIdAndUpdate(appointmentId, { status: 'cancelled' });

    return { success: true, message: 'Appointment cancelled successfully' };
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return { error: 'Failed to cancel appointment' };
  }
}
