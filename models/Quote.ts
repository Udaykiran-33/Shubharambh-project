import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuote extends Document {
  _id: mongoose.Types.ObjectId;
  quoteRequestId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  venueId: mongoose.Types.ObjectId;
  price: number;
  description: string;
  inclusions: string[];
  validUntil: Date;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    quoteRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'QuoteRequest',
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
      required: false, // Not all categories have a venue (e.g. photographers, choreographers)
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    inclusions: [{
      type: String,
    }],
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

QuoteSchema.index({ quoteRequestId: 1 });
QuoteSchema.index({ vendorId: 1 });

const Quote: Model<IQuote> = mongoose.models.Quote || mongoose.model<IQuote>('Quote', QuoteSchema);

export default Quote;
