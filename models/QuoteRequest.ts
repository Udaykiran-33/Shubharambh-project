import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuoteRequest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: string;  // free-form slug e.g. 'sangeet-night', 'wedding', 'pre-wedding-function'
  location: string;
  eventDate: Date;
  attendees?: number;
  budgetMin?: number;
  budgetMax?: number;
  requirements: string;
  notes?: string;
  category: string;
  categoryDetails?: Record<string, any>;
  venueId?: mongoose.Types.ObjectId;
  vendorIds: mongoose.Types.ObjectId[];
  source: 'website' | 'chatbot';
  status: 'pending' | 'responded' | 'closed';
  vendorResponse?: {
    status: 'accepted' | 'rejected';
    message?: string;
    respondedAt: Date;
    respondedBy: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuoteRequestSchema = new Schema<IQuoteRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      // No enum restriction — the modal sends slugs like 'sangeet-night', 'pre-wedding-function'
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    attendees: {
      type: Number,
      required: false, // Only applicable for guest-count categories (venues, caterers, etc.)
    },
    budgetMin: {
      type: Number,
      required: false,
      min: 0,
    },
    budgetMax: {
      type: Number,
      required: false,
    },
    requirements: {
      type: String,
      required: [true, 'Requirements are required'],
    },
    notes: {
      type: String,
    },
    category: {
      type: String,
      enum: ['venues', 'decorators', 'djs', 'caterers', 'photographers', 'makeup', 'mehendi', 'invitations', 'pandits', 'choreographers', 'bridal-wear', 'anchoring', 'karaoke'],
      required: true,
    },
    categoryDetails: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    source: {
      type: String,
      enum: ['website', 'chatbot'],
      default: 'website',
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
    },
    vendorIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    }],
    status: {
      type: String,
      enum: ['pending', 'responded', 'closed'],
      default: 'pending',
    },
    vendorResponse: {
      status: {
        type: String,
        enum: ['accepted', 'rejected'],
      },
      message: {
        type: String,
      },
      respondedAt: {
        type: Date,
      },
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
      },
    },
  },
  {
    timestamps: true,
  } 
);

QuoteRequestSchema.index({ userId: 1 });
QuoteRequestSchema.index({ status: 1 });
QuoteRequestSchema.index({ vendorIds: 1 }); // Index for querying by vendor

// Delete cached model so schema changes are picked up on hot-reload
if (mongoose.models.QuoteRequest) {
  delete (mongoose.models as any).QuoteRequest;
}
const QuoteRequest: Model<IQuoteRequest> = mongoose.model<IQuoteRequest>('QuoteRequest', QuoteRequestSchema);

export default QuoteRequest;
