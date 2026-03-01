'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFeaturedVenues } from '@/app/actions/venues';
import { Search, ChevronLeft, ChevronRight, ArrowRight, MapPin, Star, CheckCircle, Building2, Camera, Sparkles, X, Shield } from 'lucide-react';
import VendorJoinModal from '@/components/VendorJoinModal';

interface FeaturedVenue {
  _id: string;
  name: string;
  location: string;
  city: string;
  images: string[];
  rating: number;
  priceRange: { min: number; max: number };
}

const eventCards = [
  { id: 'wedding', name: 'Wedding', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop' },
  { id: 'wedding-reception', name: 'Wedding Reception', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=800&fit=crop' },
  { id: 'anniversary', name: 'Wedding Anniversary', image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=800&fit=crop' },
  { id: 'engagement', name: 'Ring Ceremony', image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&h=800&fit=crop' },
  { id: 'pre-wedding', name: 'Pre Wedding', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=800&fit=crop' },
  { id: 'mehendi', name: 'Mehendi Party', image: 'https://i.pinimg.com/736x/66/ab/f3/66abf35cb1da96dc17bd3a2e8f1f7779.jpg' },
  { id: 'sangeet', name: 'Sangeet Ceremony', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=800&fit=crop' },
  { id: 'bachelor-party', name: 'Bachelor Party', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=800&fit=crop' },
  { id: 'bridal-shower', name: 'Bridal Shower', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=800&fit=crop' },
  { id: 'baby-shower', name: 'Baby Shower', image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=600&h=800&fit=crop' },
  { id: 'birthday', name: "Children's Party", image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&h=800&fit=crop' },
];

const cities = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Jaipur', 'Goa'];

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentCard, setCurrentCard] = useState(Math.floor(eventCards.length / 2));
  const [featuredVenues, setFeaturedVenues] = useState<FeaturedVenue[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [searchData, setSearchData] = useState({ eventType: '', location: '' });

  useEffect(() => {
    async function loadVenues() {
      try {
        const venues = await getFeaturedVenues(3);
        setFeaturedVenues(venues);
      } catch (error) {
        console.error('Failed to load venues:', error);
      }
    }
    loadVenues();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchData.eventType) params.set('event', searchData.eventType);
    if (searchData.location) params.set('location', searchData.location);
    router.push(`/venues?${params.toString()}`);
  };

  const handleVendorJoin = () => {
    if (!session) {
      // Redirect to signup with vendor role
      router.push('/signup?role=vendor');
      return;
    }
    
    // Check if user is already a vendor
    if (session.user.role === 'vendor') {
      setShowVendorModal(true);
    } else {
      // Show upgrade modal for regular users
      setShowUpgradeModal(true);
    }
  };

  const formatPrice = (min: number, max: number) => {
    const formatNum = (n: number) => {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n}`;
    };
    return `${formatNum(min)} - ${formatNum(max)}`;
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 480 && window.innerWidth < 768;

  const getCardStyle = (index: number): React.CSSProperties => {
    const diff = index - currentCard;
    const absDiff = Math.abs(diff);
    
    if (absDiff > 3) {
      return { 
        opacity: 0, 
        transform: 'translateX(0) scale(0.5)', 
        zIndex: 0, 
        pointerEvents: 'none',
        visibility: 'hidden'
      };
    }
    
    // Responsive translateX: smaller on mobile to prevent overflow
    const translateOffset = isMobile ? 90 : isTablet ? 115 : 160;
    const translateX = diff * translateOffset;
    const rotateY = diff * -12;
    const scale = absDiff === 0 ? 1.05 : 1 - absDiff * 0.1;
    const opacity = absDiff === 0 ? 1 : Math.max(0.6, 1 - absDiff * 0.15);
    const zIndex = 10 - absDiff;
    
    return {
      transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      filter: absDiff === 0 ? 'none' : 'grayscale(0.5) brightness(0.7)',
      visibility: 'visible'
    };
  };

  const handleCardClick = (index: number) => {
    if (index === currentCard) {
      router.push(`/venues?event=${eventCards[index].id}`);
    } else {
      setCurrentCard(index);
    }
  };

  const prevCard = () => setCurrentCard((prev) => (prev - 1 + eventCards.length) % eventCards.length);
  const nextCard = () => setCurrentCard((prev) => (prev + 1) % eventCards.length);

  return (
    <div style={{ overflowX: 'hidden', background: 'var(--cream-50)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        minHeight: '100vh', 
        paddingTop: 'clamp(80px, 14vw, 120px)', 
        paddingBottom: '40px',
        background: 'linear-gradient(180deg, var(--cream-100) 0%, var(--cream-50) 50%, white 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <div style={{ 
          position: 'absolute', 
          top: '80px', 
          right: '-100px', 
          width: '400px', 
          height: '400px', 
          borderRadius: '50%', 
          background: 'var(--olive-200)', 
          filter: 'blur(120px)', 
          opacity: 0.3 
        }} />
        <div style={{ 
          position: 'absolute', 
          bottom: '100px', 
          left: '-100px', 
          width: '350px', 
          height: '350px', 
          borderRadius: '50%', 
          background: 'var(--cream-300)', 
          filter: 'blur(100px)', 
          opacity: 0.4 
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
          {/* Header Text */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
           
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
              fontWeight: 900, 
              color: 'var(--olive-800)', 
              marginBottom: '16px',
              lineHeight: 1.1
            }}>
              Discover Your Perfect Event
            </h1>
            <p style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              color: 'var(--olive-600)', 
              maxWidth: '600px', 
              margin: '0 auto' 
            }}>
              Find the best venues and services for all your celebrations
            </p>
          </div>

          {/* 3D Card Carousel */}
          <div style={{ 
            position: 'relative', 
            height: 'clamp(230px, 55vw, 450px)',
            perspective: '1500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            {/* Left Arrow */}
            <button
              onClick={prevCard}
              className="carousel-nav-btn"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(107, 142, 35, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
            >
              <ChevronLeft className="carousel-nav-icon" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={nextCard}
              className="carousel-nav-btn"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(107, 142, 35, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
            >
              <ChevronRight className="carousel-nav-icon" />
            </button>

            {/* Cards */}
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d'
            }}>
              {eventCards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  className="carousel-card"
                  style={{
                    position: 'absolute',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: index === currentCard ? '4px solid rgba(107, 142, 35, 0.5)' : '3px solid rgba(255,255,255,0.4)',
                    boxShadow: index === currentCard 
                      ? '0 25px 60px -12px rgba(0, 0, 0, 0.3)' 
                      : '0 15px 35px -10px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#f0f0f0',
                    ...getCardStyle(index)
                  }}
                >
                  {/* Card Image */}
                  <img 
                    src={card.image} 
                    alt={card.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)'
                  }} />
                  
                  {/* Featured Badge */}
                  {index === currentCard && (
                    <div className="carousel-badge" style={{
                      position: 'absolute',
                      top: '12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, var(--olive-500), var(--olive-600))',
                      color: 'white',
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(107, 142, 35, 0.4)'
                    }}>
                      Featured
                    </div>
                  )}
                  
                  {/* Card Content */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '24px',
                    textAlign: 'left',
                    opacity: index === currentCard ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}>
                    <h3 style={{ 
                      fontSize: '24px', 
                      fontWeight: 700, 
                      color: 'white', 
                      marginBottom: '8px',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                      {card.name}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: 'white', 
                      fontSize: '14px',
                      opacity: 0.9
                    }}>
                      <span>Click to Explore</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
            {eventCards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                style={{
                  width: index === currentCard ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: index === currentCard ? 'var(--olive-600)' : 'var(--olive-300)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

          {/* Current Event Name & CTA */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
              fontWeight: 900, 
              color: 'var(--olive-800)',
              marginBottom: '20px'
            }}>
              {eventCards[currentCard].name}
            </h2>                     
            <Link 
              href={`/venues?event=${eventCards[currentCard].id }`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(107, 142, 35, 0.35)',
                transition: 'all 0.3s ease'
              }}
            >
              Find Venues
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Search Section */}
      <section style={{ padding: '20px 0', background: 'white', borderTop: '1px solid var(--cream-200)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '12px' }}>Quick Search</h2>
            <p style={{ color: 'var(--olive-600)' }}>Find venues by event type and location</p>
          </div>

          <form onSubmit={handleSearch} style={{ 
            background: 'var(--cream-50)', 
            borderRadius: '16px', 
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid var(--cream-200)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--olive-600)', marginBottom: '8px' }}>Event Type</label>
                <select
                  value={searchData.eventType}
                  onChange={(e) => setSearchData({ ...searchData, eventType: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="">All Events</option>
                  {eventCards.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--olive-600)', marginBottom: '8px' }}>City</label>
                <select
                  value={searchData.location}
                  onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '16px 32px' }}>
                <Search size={18} />
                Search Venues
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Venues */}
      <section style={{ padding: '30px 0', background: 'linear-gradient(180deg, white 0%, var(--cream-50) 50%, var(--cream-100) 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
           
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--olive-800)', marginBottom: '16px' }}>Featured Venues</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--olive-600)', maxWidth: '500px', margin: '0 auto' }}>Discover our most popular venues for your special celebration</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {featuredVenues.map((venue) => (
              <Link
                key={venue._id}
                href={`/venues/${venue._id}`}
                style={{
                  display: 'block',
                  background: 'white',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <img
                    src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600'}
                    alt={venue.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--olive-800)' }}>{venue.rating}</span>
                  </div>
                  <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 12px', borderRadius: '8px', background: 'var(--olive-600)', color: 'white', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Featured</div>
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--olive-800)', marginBottom: '8px' }}>{venue.name}</h3>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--olive-500)', marginBottom: '16px' }}>
                    <MapPin size={14} />
                    {venue.city || venue.location}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--cream-200)' }}>
                    <div>
                      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--olive-400)', marginBottom: '4px' }}>Starting from</p>
                      <span style={{ fontWeight: 700, color: 'var(--olive-700)' }}>{formatPrice(venue.priceRange.min, venue.priceRange.max)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'var(--cream-100)', color: 'var(--olive-600)', fontWeight: 600, fontSize: '14px' }}>
                      View
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/venues" className="btn btn-outline" style={{ padding: '16px 32px' }}>
              View All Venues
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Join as Vendor Section */}
      <section style={{ padding: '60px 0', background: 'linear-gradient(135deg, var(--olive-700) 0%, var(--olive-800) 50%, var(--olive-900) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50px', right: '-50px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '50px', left: '-50px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', filter: 'blur(60px)' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '64px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} style={{ color: 'var(--cream-100)' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cream-300)' }}>For Vendors</span>
              </div>

              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: 'white', marginBottom: '20px' }}>Join Our Vendor Network</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--cream-200)', marginBottom: '32px', lineHeight: 1.7 }}>
                List your venue and reach thousands of couples planning their special day.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                {[
                  { icon: Camera, text: 'Showcase your venue with photos' },
                  { icon: Sparkles, text: 'Get discovered by couples' },
                  { icon: CheckCircle, text: 'Receive direct enquiries' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={18} style={{ color: 'var(--cream-100)' }} />
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--cream-100)' }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleVendorJoin}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  background: 'white',
                  color: 'var(--olive-700)',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                List Your's
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Visual Grid — floating images */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <style>{`
                @keyframes floatImg { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
              `}</style>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ height: '150px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', animation: 'floatImg 5.2s ease-in-out infinite' }}>
                  <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400" alt="Venue" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
                </div>
                <div style={{ height: '220px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', animation: 'floatImg 6.8s ease-in-out infinite 1.1s' }}>
                  <img src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400" alt="Venue" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '40px' }}>
                <div style={{ height: '220px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', animation: 'floatImg 7.5s ease-in-out infinite 0.5s' }}>
                  <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400" alt="Venue" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
                </div>
                <div style={{ height: '150px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', animation: 'floatImg 5.9s ease-in-out infinite 1.8s' }}>
                  <img src="https://images.unsplash.com/photo-1529636798458-92182e662485?w=400" alt="Venue" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Modal */}
      {showVendorModal && <VendorJoinModal onClose={() => setShowVendorModal(false)} />}

      {/* Upgrade to Vendor Modal */}
      {showUpgradeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={() => setShowUpgradeModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl" 
            onClick={e => e.stopPropagation()}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            {/* Header */}
            <div 
              className="px-8 py-6 rounded-t-3xl" 
              style={{ background: 'linear-gradient(135deg, #949e21ff)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">User Account</h2>
                  <p className="text-sm text-white/90">Cannot List Services</p>
                </div>
                <button 
                  onClick={() => setShowUpgradeModal(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#fef3c7' }}
                >
                  <Shield size={24} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--olive-800)' }}>
                    Regular User Account
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--olive-600)' }}>
                    Your account is registered as a regular user. Regular users can browse venues, request quotes, and book appointments, but cannot list their own venues or services.
                  </p>
                </div>
              </div>

              <div 
                className="p-5 rounded-2xl mb-6"
                style={{ background: '#eff6ff', border: '2px solid #dbeafe' }}
              >
                <h4 className="font-bold text-sm mb-3" style={{ color: '#1e40af' }}>
                  To list your venue or services:
                </h4>
                <ul className="space-y-2 text-sm" style={{ color: '#1e3a8a' }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>You need a <strong>Vendor Account</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Create a new account by clicking the <strong>&quot;List Yours&quot;</strong> button after logging out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Or contact support to upgrade this account</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-4 px-6 rounded-xl font-semibold transition-colors"
                  style={{ background: 'var(--cream-200)', color: 'var(--olive-700)' }}
                >
                  Got It
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push('/venues');
                  }}
                  className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-white transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--olive-600), var(--olive-700))' }}
                >
                  Browse Venues
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section style={{ padding: '60px 0', background: 'var(--cream-50)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--olive-500)', marginBottom: '16px' }}>Get Started Today</p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--olive-800)', marginBottom: '20px' }}>
            Ready to Plan Your Dream Event?
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--olive-600)', marginBottom: '40px' }}>
            Join thousands of happy couples who found their perfect venue through Shubharambh
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <Link href="/venues" className="btn btn-primary" style={{ padding: '18px 36px', fontSize: '16px' }}>
              Explore Venues
              <ArrowRight size={20} />
            </Link>
            <Link href="/signup" className="btn btn-secondary" style={{ padding: '18px 36px', fontSize: '16px' }}>
              Create Free Account
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--cream-300)' }}>
            {[
              { value: '500+', label: 'Premium Venues' },
              { value: '10,000+', label: 'Happy Couples' },
              { value: '50+', label: 'Cities' }
            ].map((stat, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--olive-700)', marginBottom: '8px' }}>{stat.value}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--olive-500)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
