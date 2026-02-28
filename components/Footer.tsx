import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-olive-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="text-left">
            <div className="flex items-center gap-3 mb-6 justify-start">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-olive-600" style={{ background: 'linear-gradient(135deg, var(--olive-500) 0%, var(--olive-600) 100%)' }}>
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-xl font-black tracking-tight">Shubharambh</span>
            </div>
            <p className="leading-relaxed mb-6 text-olive-300 max-w-xs">
              Your perfect event starts here. Discover venues, get quotes, and plan your celebration with ease.
            </p>
            <div className="flex gap-3 justify-start">
              <a href="#" className="w-11 h-11 rounded-xl flex items-center justify-center bg-olive-800 transition-colors hover:bg-olive-700">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-11 h-11 rounded-xl flex items-center justify-center bg-olive-800 transition-colors hover:bg-olive-700">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-11 h-11 rounded-xl flex items-center justify-center bg-olive-800 transition-colors hover:bg-olive-700">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h3 className="text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Link href="/categories" className="text-olive-300 transition-colors hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/venues" className="text-olive-300 transition-colors hover:text-white">
                  All Venues
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-olive-300 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Types */}
          <div className="text-left">
            <h3 className="text-lg font-bold mb-6">Event Types</h3>
            <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Link href="/venues?event=wedding" className="text-olive-300 transition-colors hover:text-white">
                  Weddings
                </Link>
              </li>
              <li>
                <Link href="/venues?event=engagement" className="text-olive-300 transition-colors hover:text-white">
                  Engagements
                </Link>
              </li>
              <li>
                <Link href="/venues?event=birthday" className="text-olive-300 transition-colors hover:text-white">
                  Birthdays
                </Link>
              </li>
              <li>
                <Link href="/venues?event=anniversary" className="text-olive-300 transition-colors hover:text-white">
                  Anniversaries
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-left">
            <h3 className="text-lg font-bold mb-6">Get in Touch</h3>
            <ul className="space-y-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li className="flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-olive-800">
                  <Mail size={18} className="text-olive-400" />
                </div>
                <span className="text-olive-300 text-sm">teamshubharambh021@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-olive-800">
                  <Phone size={18} className="text-olive-400" />
                </div>
                <span className="text-olive-300 text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-olive-800">
                  <MapPin size={18} className="text-olive-400" />
                </div>
                <span className="text-olive-300 text-sm">Hyderabad, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-olive-800">
          <p className="text-sm flex items-center gap-2 text-olive-400">
            Made with <Heart size={14} className="text-red-400" /> © 2024 Shubharambh
          </p>
          <div className="flex gap-6 text-sm text-olive-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
