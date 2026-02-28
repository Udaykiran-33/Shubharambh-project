import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;  // Links to User._id for session-based lookup
  name: string;
  email: string;
  phone: string;
  businessName: string;
  description?: string;
  categories: ('venues' | 'decorators' | 'djs' | 'caterers' | 'photographers' | 'makeup' | 'mehendi' | 'invitations' | 'pandits' | 'choreographers' | 'bridal-wear' | 'anchoring' | 'karaoke')[];
  locations: string[];
  images: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  isActive: boolean;
  // Verification fields for admin approval
  status: 'pending' | 'approved' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    categories: [{
      type: String,
      enum: ['venues', 'decorators', 'djs', 'caterers', 'photographers', 'makeup', 'mehendi', 'invitations', 'pandits', 'choreographers', 'bridal-wear', 'anchoring', 'karaoke'],
    }],
    locations: [{
      type: String,
      trim: true,
    }],
    images: [{
      type: String,
    }],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: false, // Only true after admin approval
    },
    // Admin verification fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for category queries
VendorSchema.index({ userId: 1 });
VendorSchema.index({ categories: 1 });
VendorSchema.index({ status: 1 });
VendorSchema.index({ isActive: 1 });

const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;
