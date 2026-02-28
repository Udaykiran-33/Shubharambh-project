import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  venueId: mongoose.Types.ObjectId;
  type: 'appointment' | 'visit';
  scheduledDate: Date;
  scheduledTime: string;
  eventType: 'engagement' | 'wedding' | 'birthday' | 'anniversary';
  attendees: number;
  notes?: string;
  contactShared: boolean;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'visit'],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
    },
    eventType: {
      type: String,
      enum: ['engagement', 'wedding', 'birthday', 'anniversary'],
      required: true,
    },
    attendees: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String,
    },
    contactShared: {
      type: Boolean,
      default: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ userId: 1 });
AppointmentSchema.index({ vendorId: 1 });
AppointmentSchema.index({ status: 1 });

const Appointment: Model<IAppointment> = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
