import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVenue extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  name: string;
  type: 'venue' | 'decorator' | 'dj' | 'caterer' | 'photographer' | 'makeup_artist' | 'mehendi_artist' | 'invitation' | 'pandit' | 'choreographer' | 'bridal_wear' | 'anchor' | 'karaoke' | 'service';
  category: 'venues' | 'decorators' | 'djs' | 'caterers' | 'photographers' | 'makeup' | 'mehendi' | 'invitations' | 'pandits' | 'choreographers' | 'bridal-wear' | 'anchoring' | 'karaoke';
  eventTypes: ('engagement' | 'wedding' | 'birthday' | 'anniversary' | 'wedding-reception' | 'pre-wedding' | 'mehendi' | 'sangeet' | 'bachelor-party' | 'bridal-shower' | 'baby-shower')[];
  location: string;
  city: string;
  address: string;
  capacity: {
    min: number;
    max: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  priceUnit?: string;  // "per event", "per day", "per plate", etc.
  images: string[];
  amenities: string[];
  highlights: string[];
  description: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  // Category-specific service details
  serviceDetails?: {
    // Common
    experience?: number;
    teamSize?: number;
    // Photographers
    photoStyles?: string;
    equipment?: string;
    // Caterers
    cuisines?: string;
    minPlates?: number;
    maxPlates?: number;
    // Decorators
    decorStyles?: string;
    // Makeup
    makeupStyles?: string;
    brands?: string;
    servicesOffered?: string;
    // Mehendi
    mehendiStyles?: string;
    mehendiType?: string;
    // DJ/Music
    musicStyles?: string;
    // Invitations
    cardTypes?: string;
    customization?: string;
    minOrder?: number;
    // Pandits
    ceremonies?: string;
    languages?: string;
    // Choreographers
    danceStyles?: string;
    // Bridal Wear
    dressTypes?: string;
    sizes?: string;
    // Anchoring
    eventSpecialties?: string;
    // Karaoke
    songLibrary?: string;
    // Venues
    venueType?: string;
  };
  // Verification fields for admin approval
  status: 'pending' | 'approved' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['venue', 'decorator', 'dj', 'caterer', 'photographer', 'makeup_artist', 'mehendi_artist', 'invitation', 'pandit', 'choreographer', 'bridal_wear', 'anchor', 'karaoke', 'service'],
      required: true,
    },
    category: {
      type: String,
      enum: ['venues', 'decorators', 'djs', 'caterers', 'photographers', 'makeup', 'mehendi', 'invitations', 'pandits', 'choreographers', 'bridal-wear', 'anchoring', 'karaoke'],
      required: true,
    },
    eventTypes: [{
      type: String,
      enum: ['engagement', 'wedding', 'birthday', 'anniversary', 'wedding-reception', 'pre-wedding', 'mehendi', 'sangeet', 'bachelor-party', 'bridal-shower', 'baby-shower'],
    }],
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    capacity: {
      min: { type: Number, default: 0 },
      max: { type: Number, required: true },
    },
    priceRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    priceUnit: {
      type: String,
      default: 'per event',
    },
    images: [{
      type: String,
    }],
    amenities: [{
      type: String,
    }],
    highlights: [{
      type: String,
    }],
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: false, // Changed to false - only true after admin approval
    },
    // Category-specific service details
    serviceDetails: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
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

// Index for search
VenueSchema.index({ location: 'text', name: 'text', city: 'text' });
VenueSchema.index({ eventTypes: 1 });
VenueSchema.index({ city: 1 });
VenueSchema.index({ category: 1 });

const Venue: Model<IVenue> = mongoose.models.Venue || mongoose.model<IVenue>('Venue', VenueSchema);

export default Venue;
