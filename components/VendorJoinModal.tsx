'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { registerVendorWithVenue, addVenueListing } from '@/app/actions/vendor-register';
import { X, Upload, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface VendorJoinModalProps {
  onClose: () => void;
  mode?: 'register' | 'add-listing';
}

// Category-specific field configurations
const categoryConfig: Record<string, {
  label: string;
  businessNameLabel: string;
  businessNamePlaceholder: string;
  priceLabel: string;
  priceUnit: string;
  fields: { key: string; label: string; placeholder: string; type: string }[];
  descriptionPlaceholder: string;
  photoHint: string;
}> = {
  venues: {
    label: 'Venue / Banquet Hall',
    businessNameLabel: 'Venue Name',
    businessNamePlaceholder: 'e.g., Grand Palace Banquet Hall',
    priceLabel: 'Price Range (per event)',
    priceUnit: 'per event',
    fields: [
      { key: 'capacity', label: 'Maximum Capacity (guests)', placeholder: 'e.g., 500', type: 'number' },
      { key: 'venueType', label: 'Venue Type', placeholder: 'e.g., Indoor, Outdoor, Both', type: 'text' },
    ],
    descriptionPlaceholder: 'Tell customers about your venue, facilities, parking, catering options, and what makes it special...',
    photoHint: 'Upload photos of your venue halls, decorations, and outdoor areas',
  },
  decorators: {
    label: 'Decorator',
    businessNameLabel: 'Business Name',
    businessNamePlaceholder: 'e.g., Elegant Decor Studio',
    priceLabel: 'Starting Price (per event)',
    priceUnit: 'per event',
    fields: [
      { key: 'decorStyles', label: 'Decoration Styles', placeholder: 'e.g., Traditional, Modern, Floral, Theme-based', type: 'text' },
      { key: 'teamSize', label: 'Team Size', placeholder: 'e.g., 10', type: 'number' },
    ],
    descriptionPlaceholder: 'Describe your decoration services, specialties, materials used, and past event experiences...',
    photoHint: 'Upload photos of your best decoration work and setups',
  },
  photographers: {
    label: 'Photographer',
    businessNameLabel: 'Studio / Business Name',
    businessNamePlaceholder: 'e.g., Memories Photography Studio',
    priceLabel: 'Starting Package Price',
    priceUnit: 'per day',
    fields: [
      { key: 'photoStyles', label: 'Photography Styles', placeholder: 'e.g., Candid, Traditional, Cinematic', type: 'text' },
      { key: 'equipment', label: 'Equipment', placeholder: 'e.g., DSLR, Drone, 4K Video', type: 'text' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 5', type: 'number' },
    ],
    descriptionPlaceholder: 'Share your photography journey, specialties, delivery time, album options, and team details...',
    photoHint: 'Upload your best photography work samples',
  },
  caterers: {
    label: 'Caterer',
    businessNameLabel: 'Catering Business Name',
    businessNamePlaceholder: 'e.g., Royal Kitchen Caterers',
    priceLabel: 'Price Range (per plate)',
    priceUnit: 'per plate',
    fields: [
      { key: 'cuisines', label: 'Cuisines Offered', placeholder: 'e.g., North Indian, South Indian, Chinese, Continental', type: 'text' },
      { key: 'minPlates', label: 'Minimum Order (plates)', placeholder: 'e.g., 100', type: 'number' },
      { key: 'maxPlates', label: 'Maximum Capacity (plates)', placeholder: 'e.g., 1000', type: 'number' },
    ],
    descriptionPlaceholder: 'Describe your menu options, live counters, special dishes, staff, and hygiene standards...',
    photoHint: 'Upload photos of your food presentations and setups',
  },
  djs: {
    label: 'DJ / Music',
    businessNameLabel: 'DJ / Band Name',
    businessNamePlaceholder: 'e.g., DJ Spark Entertainment',
    priceLabel: 'Starting Price (per event)',
    priceUnit: 'per event',
    fields: [
      { key: 'musicStyles', label: 'Music Styles', placeholder: 'e.g., Bollywood, EDM, Sufi, Classical', type: 'text' },
      { key: 'equipment', label: 'Equipment Provided', placeholder: 'e.g., Sound System, LED Lights, Fog Machine', type: 'text' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 8', type: 'number' },
    ],
    descriptionPlaceholder: 'Share your music journey, event experiences, equipment quality, and special performances...',
    photoHint: 'Upload photos of your live performances and setups',
  },
  makeup: {
    label: 'Makeup Artist',
    businessNameLabel: 'Artist / Studio Name',
    businessNamePlaceholder: 'e.g., Glamour by Priya',
    priceLabel: 'Starting Price (per look)',
    priceUnit: 'per look',
    fields: [
      { key: 'makeupStyles', label: 'Makeup Styles', placeholder: 'e.g., Bridal, Party, HD, Airbrush', type: 'text' },
      { key: 'servicesOffered', label: 'Services Offered', placeholder: 'e.g., Bridal Makeup, Mehendi, Hairstyling, Draping', type: 'text' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 6', type: 'number' },
      { key: 'brands', label: 'Brands Used', placeholder: 'e.g., MAC, Bobbi Brown, Lakme', type: 'text' },
    ],
    descriptionPlaceholder: 'Share your specialties, training, product brands used, trial makeup options, and travel availability...',
    photoHint: 'Upload photos of your best bridal and party makeup looks',
  },
  mehendi: {
    label: 'Mehendi Artist',
    businessNameLabel: 'Artist Name',
    businessNamePlaceholder: 'e.g., Heena by Anjali',
    priceLabel: 'Starting Price',
    priceUnit: 'per hand',
    fields: [
      { key: 'mehendiStyles', label: 'Mehendi Styles', placeholder: 'e.g., Arabic, Indian, Indo-Arabic, Moroccan', type: 'text' },
      { key: 'mehendiType', label: 'Mehendi Type', placeholder: 'e.g., Natural, Dark Stain, Organic', type: 'text' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 10', type: 'number' },
    ],
    descriptionPlaceholder: 'Describe your mehendi style specialties, the quality of henna used, travel availability, and team size...',
    photoHint: 'Upload p  hotos of your best mehendi designs',
  },
  invitations: {
    label: 'Invitations',
    businessNameLabel: 'Business Name',
    businessNamePlaceholder: 'e.g., Creative Cards Studio',
    priceLabel: 'Starting Price (per set)',
    priceUnit: 'per 100 cards',
    fields: [
      { key: 'cardTypes', label: 'Card Types', placeholder: 'e.g., Printed, Handmade, Digital, Box Cards', type: 'text' },
      { key: 'customization', label: 'Customization Options', placeholder: 'e.g., Names, Photos, QR Codes, Videos', type: 'text' },
      { key: 'minOrder', label: 'Minimum Order Quantity', placeholder: 'e.g., 50', type: 'number' },
    ],
    descriptionPlaceholder: 'Describe your invitation styles, printing quality, delivery time, and customization capabilities...',
    photoHint: 'Upload photos of your invitation card designs',
  },
  pandits: {
    label: 'Pandit / Priest',
    businessNameLabel: 'Pandit Name',
    businessNamePlaceholder: 'e.g., Pandit Sharma Ji',
    priceLabel: 'Starting Price (per ceremony)',
    priceUnit: 'per ceremony',
    fields: [
      { key: 'ceremonies', label: 'Ceremonies Performed', placeholder: 'e.g., Wedding, Griha Pravesh, Satyanarayan Puja', type: 'text' },
      { key: 'languages', label: 'Languages', placeholder: 'e.g., Hindi, Sanskrit, Telugu', type: 'text' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 15', type: 'number' },
    ],
    descriptionPlaceholder: 'Describe your expertise in vedic rituals, ceremonies conducted, and your approach...',
    photoHint: 'Upload photos of ceremonies you have conducted',
  },
  choreographers: {
    label: 'Choreographer',
    businessNameLabel: 'Artist / Team Name',
    businessNamePlaceholder: 'e.g., Dance Vibes Academy',
    priceLabel: 'Starting Price (per performance)',
    priceUnit: 'per performance',
    fields: [
      { key: 'danceStyles', label: 'Dance Styles', placeholder: 'e.g., Bollywood, Classical, Western, Folk', type: 'text' },
      { key: 'teamSize', label: 'Team Size', placeholder: 'e.g., 5', type: 'number' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 8', type: 'number' },
    ],
    descriptionPlaceholder: 'Share your dance journey, performances, training approach, and team details...',
    photoHint: 'Upload photos of your dance performances',
  },
  'bridal-wear': {
    label: 'Bridal Wear / Rentals',
    businessNameLabel: 'Store Name',
    businessNamePlaceholder: 'e.g., Royal Bridal Collection',
    priceLabel: 'Starting Rental Price',
    priceUnit: 'per day',
    fields: [
      { key: 'dressTypes', label: 'Dress Types', placeholder: 'e.g., Lehenga, Saree, Sherwani, Suits', type: 'text' },
      { key: 'sizes', label: 'Sizes Available', placeholder: 'e.g., XS to XXL, Custom Fitting', type: 'text' },
    ],
    descriptionPlaceholder: 'Describe your collection, brands, rental process, and fitting services...',
    photoHint: 'Upload photos of your dress collection',
  },
  anchoring: {
    label: 'Anchor / Emcee',
    businessNameLabel: 'Artist Name',
    businessNamePlaceholder: 'e.g., Anchor Raj',
    priceLabel: 'Starting Price (per event)',
    priceUnit: 'per event',
    fields: [
      { key: 'eventTypes', label: 'Event Specialties', placeholder: 'e.g., Wedding, Corporate, Birthday', type: 'text' },
      { key: 'languages', label: 'Languages', placeholder: 'e.g., Hindi, English, Telugu', type: 'text' },
      { key: 'experience', label: 'Years of Experience', placeholder: 'e.g., 5', type: 'number' },
    ],
    descriptionPlaceholder: 'Share your hosting experience, event types, and your unique style...',
    photoHint: 'Upload photos of your hosting events',
  },
  karaoke: {
    label: 'Karaoke',
    businessNameLabel: 'Business Name',
    businessNamePlaceholder: 'e.g., Sing Along Entertainment',
    priceLabel: 'Starting Price (per event)',
    priceUnit: 'per event',
    fields: [
      { key: 'equipment', label: 'Equipment', placeholder: 'e.g., Professional Mics, Speakers, Screen', type: 'text' },
      { key: 'songLibrary', label: 'Song Library', placeholder: 'e.g., 10000+ songs, Bollywood, English', type: 'text' },
    ],
    descriptionPlaceholder: 'Describe your karaoke setup, song collection, and party packages...',
    photoHint: 'Upload photos of your karaoke setup',
  },
};

export default function VendorJoinModal({ onClose, mode = 'register' }: VendorJoinModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Record<string, string | string[]>>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: session?.user?.phone || '',
    businessName: '',
    category: 'venues',
    location: '',
    city: '',
    address: '',
    description: '',
    priceMin: '',
    priceMax: '',
    eventTypes: ['wedding'],
    // Dynamic fields will be added based on category
  });

  // Auto-fill user data when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
        phone: session.user.phone || prev.phone,
      }));
    }
  }, [session]);

  const currentConfig = categoryConfig[formData.category as string] || categoryConfig.venues;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImages(prev => {
          // Check if we already have 3 images
          if (prev.length >= 3) return prev;
          // Add new image to the array
          return [...prev, result];
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          submitData.append(key, value.join(','));
        } else {
          submitData.append(key, value as string);
        }
      });

      // Rename businessName to venueName for backend compatibility
      submitData.set('venueName', formData.businessName as string);

      // Send actual uploaded images as base64
      uploadedImages.forEach((imageData, index) => {
        submitData.append(`image_${index}`, imageData);
      });
      submitData.append('imageCount', uploadedImages.length.toString());

      // Choose action based on mode
      const result = mode === 'add-listing'
        ? await addVenueListing(submitData)
        : await registerVendorWithVenue(submitData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="modal-content bg-white rounded-3xl p-6 md:p-10 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))' }}
          >
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--olive-800)' }}>
            Welcome Aboard!
          </h2>
          <p className="mb-8" style={{ color: 'var(--olive-600)' }}>
            Your listing has been submitted successfully and will be live on our platform soon!
          </p>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-xl font-bold text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="modal-content bg-white rounded-3xl md:rounded-3xl max-w-xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 px-4 md:px-8 py-4 md:py-6 rounded-t-3xl md:rounded-t-3xl flex items-center justify-between z-10"
          style={{ background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' }}
        >
          <div>
            <h2 className="text-2xl font-bold text-white">
              {mode === 'add-listing' ? 'Add New Listing' : 'Join as Vendor'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--cream-200)' }}>Step {step} of 2</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
          >
            <X size={22} className="text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-4" style={{ background: 'var(--cream-50)' }}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--cream-200)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: step === 1 ? '50%' : '100%',
                    background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))'
                  }}
                />
              </div>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--olive-600)' }}>
              {step}/2
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {error && (
            <div 
              className="p-4 rounded-xl mb-6 text-sm border"
              style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fee2e2' }}
            >
              {error}
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Personal & Business Info */
            <div className="space-y-6">
              {/* Step 1 content — show personal details only for 'register' mode */}
              {mode === 'register' && (
                <div 
                  className="p-5 rounded-2xl"
                  style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)' }}
                >
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--olive-600)' }}>
                    Your Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name as string}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Enter your full name"
                        readOnly={!!session?.user?.name}
                        className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all focus:outline-none"
                        style={{ 
                          borderColor: 'var(--cream-300)', 
                          color: 'var(--olive-800)',
                          background: session?.user?.name ? 'var(--cream-100)' : 'white',
                          cursor: session?.user?.name ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email as string}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="your@email.com"
                          readOnly={!!session?.user?.email}
                          className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all focus:outline-none"
                          style={{ 
                            borderColor: 'var(--cream-300)', 
                            color: 'var(--olive-800)',
                            background: session?.user?.email ? 'var(--cream-100)' : 'white',
                            cursor: session?.user?.email ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone as string}
                          onChange={(e) => updateField('phone', e.target.value)}
                          onInput={(e) => {
                            const input = e.currentTarget;
                            input.value = input.value.replace(/[^0-9+\- ]/g, '');
                          }}
                          pattern="[0-9+\- ]*"
                          inputMode="numeric"
                          placeholder="+91 XXXXX XXXXX"
                          readOnly={!!session?.user?.phone}
                          className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all focus:outline-none"
                          style={{ 
                            borderColor: 'var(--cream-300)', 
                            color: 'var(--olive-800)',
                            background: session?.user?.phone ? 'var(--cream-100)' : 'white',
                            cursor: session?.user?.phone ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Details Section */}
              <div 
                className="p-5 rounded-2xl"
                style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)' }}
              >
                <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--olive-600)' }}>
                  Business Details
                </h3>
                <div className="space-y-4">
                  {/* Category Selection - First so it affects other fields */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                      Category *
                    </label>
                    <select
                      value={formData.category as string}
                      onChange={(e) => updateField('category', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border-2 text-sm focus:outline-none"
                      style={{ 
                        borderColor: 'var(--cream-300)', 
                        color: 'var(--olive-800)',
                        background: 'white'
                      }}
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                      {currentConfig.businessNameLabel} *
                    </label>
                    <input
                      type="text"
                      value={formData.businessName as string}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder={currentConfig.businessNamePlaceholder}
                      className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all focus:outline-none"
                      style={{ 
                        borderColor: 'var(--cream-300)', 
                        color: 'var(--olive-800)',
                        background: 'white'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.city as string}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="e.g., Hyderabad"
                        className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all focus:outline-none"
                        style={{ 
                          borderColor: 'var(--cream-300)', 
                          color: 'var(--olive-800)',
                          background: 'white'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--olive-700)' }}>
                        Area / Locality *
                      </label>
                      <input
                        type="text"
                        value={formData.location as string}
                        onChange={(e) => updateField('location', e.target.value)}
                        placeholder="e.g., Banjara Hills"
                        className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all focus:outline-none"
                        style={{ 
                          borderColor: 'var(--cream-300)', 
                          color: 'var(--olive-800)',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={
                  mode === 'register'
                    ? (!formData.name || !formData.email || !formData.businessName || !formData.city || !formData.location)
                    : (!formData.businessName || !formData.city || !formData.location)
                }
                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' }}
              >
                Continue →
              </button>
            </div>
          ) : (
            /* Step 2: Category-Specific Details & Photos */
            <div className="space-y-4">
              {/* Photos Section */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)' }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--olive-600)' }}>
                  Upload Photos (2-3 images)
                </h3>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="relative">
                      {uploadedImages[index] ? (
                        <div className="relative group">
                          <div 
                            className="aspect-square rounded-lg overflow-hidden border-2"
                            style={{ borderColor: 'var(--olive-500)' }}
                          >
                            <img 
                              src={uploadedImages[index]} 
                              alt={`Upload ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:border-olive-500"
                          style={{ 
                            borderColor: 'var(--cream-400)', 
                            background: 'white',
                            color: 'var(--olive-500)'
                          }}
                        >
                          <Plus size={20} />
                          <span className="text-xs font-medium">Add</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category-Specific Fields Section */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: 'var(--cream-50)', border: '1px solid var(--cream-200)' }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--olive-600)' }}>
                  Service Details
                </h3>
                <div className="space-y-3">
                  {/* Dynamic category-specific fields */}
                  {currentConfig.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--olive-700)' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={(formData[field.key] as string) || ''}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 rounded-lg border-2 text-sm transition-all focus:outline-none"
                        style={{ 
                          borderColor: 'var(--cream-300)', 
                          color: 'var(--olive-800)',
                          background: 'white'
                        }}
                      />
                    </div>
                  ))}

                  {/* Pricing */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--olive-700)' }}>
                      {currentConfig.priceLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={formData.priceMin as string}
                        onChange={(e) => updateField('priceMin', e.target.value)}
                        placeholder="Min (₹)"
                        className="w-full px-3 py-2.5 rounded-lg border-2 text-sm transition-all focus:outline-none"
                        style={{ 
                          borderColor: 'var(--cream-300)', 
                          color: 'var(--olive-800)',
                          background: 'white'
                        }}
                      />
                      <input
                        type="number"
                        value={formData.priceMax as string}
                        onChange={(e) => updateField('priceMax', e.target.value)}
                        placeholder="Max (₹)"
                        className="w-full px-3 py-2.5 rounded-lg border-2 text-sm transition-all focus:outline-none"
                        style={{ 
                          borderColor: 'var(--cream-300)', 
                          color: 'var(--olive-800)',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--olive-700)' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description as string}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={currentConfig.descriptionPlaceholder}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border-2 text-sm resize-none focus:outline-none"
                      style={{ 
                        borderColor: 'var(--cream-300)', 
                        color: 'var(--olive-800)',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg font-bold transition-all hover:shadow-md"
                  style={{ background: 'var(--cream-200)', color: 'var(--olive-700)' }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
