import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Vendor from '@/models/Vendor';
import Venue from '@/models/Venue';

export async function GET() {
  try {
    await dbConnect();

    const allAppointments = await Appointment.find({})
      .populate('userId', 'name email')
      .populate('venueId', 'name vendorId')
      .lean();

    const allVendors = await Vendor.find({}).select('email name').lean();
    const allVenues = await Venue.find({}).select('name vendorId').lean();

    return NextResponse.json({
      appointments: allAppointments.map((a: any) => ({
        _id: a._id.toString(),
        userId: a.userId?._id?.toString(),
        userName: a.userId?.name,
        venueId: a.venueId?._id?.toString(),
        venueName: a.venueId?.name,
        venueVendorId: a.venueId?.vendorId?.toString(),
        appointmentVendorId: a.vendorId?.toString(),
        status: a.status,
        scheduledDate: a.scheduledDate,
      })),
      vendors: allVendors.map((v: any) => ({
        _id: v._id.toString(),
        email: v.email,
        name: v.name,
      })),
      venues: allVenues.map((v: any) => ({
        _id: v._id.toString(),
        name: v.name,
        vendorId: v.vendorId?.toString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
