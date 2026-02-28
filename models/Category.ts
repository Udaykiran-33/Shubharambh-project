import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
  backgroundColor: string;
  isActive: boolean;
  order: number;
  highlights: string[];
  amenities: string[];
  priceLabel: string;
  priceUnit: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: '🎉',
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    backgroundColor: {
      type: String,
      default: '#f5f0e8',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    highlights: {
      type: [String],
      default: ['Verified Vendor', 'New Listing'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    priceLabel: {
      type: String,
      default: 'Starting Price',
    },
    priceUnit: {
      type: String,
      default: 'per event',
    },
  },
  { timestamps: true }
);

// Ensure indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ order: 1 });
CategorySchema.index({ isActive: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
