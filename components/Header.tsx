// components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { Menu, X, User, Library, BookMarked, ChevronDown } from "lucide-react";

const menuItems = [
  { name: "Accueil", href: "/" },
  { name: "À propos", href: "/apropos" },
  { name: "Programmes", href: "/programmes" },
  { name: "Actualités", href: "/actualites" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

// Items du dropdown Ressources
const dropdownItems = [
  { name: "Bibliothèque", href: "/bibliotheque", icon: Library },
  { name: "Librairie", href: "/librairie", icon: BookMarked },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
              <Image 
                src="/img/logo.jpg"
                alt="Logo E.I.E.F"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-xl text-blue-900">E.I.E.F</span>
              <span className="text-xs text-gray-500 block">Ecole Internationale des Enfants Futur</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                {item.name}
              </Link>
            ))}
            
            {/* Dropdown Ressources */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Ressources
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {dropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border z-50"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              Connexion
              <User className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-blue-600 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Dropdown mobile */}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-gray-500 text-sm px-2 py-1">Ressources</p>
              {dropdownItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 py-2 pl-4 text-gray-700 hover:text-blue-600 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>
            
            <Link
              href="/login"
              className="block mt-2 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Connexion
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}