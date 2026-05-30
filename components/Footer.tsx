// components/Footer.tsx - Version avec Facebook, LinkedIn et YouTube
"use client";

import Link from "next/link";
import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";

// Icône Facebook personnalisée (SVG)
const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// Icône LinkedIn personnalisée (SVG)
const LinkedinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Icône YouTube personnalisée (SVG)
const YoutubeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* À propos */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">E.I.E.F</span>
            </div>
            <p className="text-sm leading-relaxed">
              École Internationale des Enfants Futur - Une éducation pour former les leaders de demain.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition">Accueil</Link></li>
              <li><Link href="/about" className="hover:text-blue-400 transition">À propos</Link></li>
              <li><Link href="/admissions" className="hover:text-blue-400 transition">Admissions</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-400" />
                Conakry, Guinée
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400" />
                +224 628 84 84 37
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400" />
                contact@eief.edu.gn
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <p className="text-sm mb-3">Recevez nos actualités</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-3 py-2 rounded-l-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-700 transition">
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Réseaux sociaux - Facebook, LinkedIn, YouTube */}
        <div className="flex justify-center space-x-6 mb-8">
          <a 
            href="#" 
            className="hover:text-blue-400 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon />
          </a>
          <a 
            href="#" 
            className="hover:text-blue-400 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedinIcon />
          </a>
          <a 
            href="#" 
            className="hover:text-red-600 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            <YoutubeIcon />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs pt-8 border-t border-gray-800">
          <p>&copy; {new Date().getFullYear()} École Internationale des Enfants Futur. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}