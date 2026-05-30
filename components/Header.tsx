// components/Header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image"; 
import { Menu, X, User, ChevronDown, Bell } from "lucide-react";

const menuItems = [
  { name: "Accueil", href: "/" },
  { name: "À propos", href: "/apropos" },
  { name: "Programmes", href: "/programmes" },
  { 
    name: "Annonces", 
    href: "/annonces", 
    icon: Bell,
    badge: 3  // Nombre de nouvelles annonces non lues
  },
];

// Items du dropdown Ressources
const dropdownItems = [
  { name: "Blog", href: "/blog" },
  { name: "Bibliothèque", href: "/bibliotheque" },
  { name: "Librairie", href: "/librairie" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname(); // Récupère le chemin actuel
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Fonction pour vérifier si un lien est actif
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

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
              <span className="text-xs text-black block">Ecole Internationale des Enfants Futur</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-1 transition font-medium ${
                    active 
                      ? "text-blue-600 border-b-2 border-blue-600 pb-0.5" 
                      : "text-black hover:text-blue-600"
                  }`}
                >
                  {item.name}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Dropdown Ressources */}
            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1 transition font-medium ${
                  dropdownOpen ? "text-blue-600" : "text-black hover:text-blue-600"
                }`}
              >
                Ressources
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {dropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border z-50"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-black hover:bg-blue-50 hover:text-blue-600 transition"
                    >
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
<<<<<<< HEAD
            {mobileMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
          </button>
        </div>

        {/* Mobile Menu - BACKGROUND NOIR */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 bg-black rounded-lg">
=======
            {mobileMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
<<<<<<< HEAD
                  className={`relative flex items-center gap-2 py-2 px-2 transition ${
                    active ? "text-blue-400 font-semibold" : "text-white hover:text-blue-400"
=======
                  className={`relative flex items-center gap-2 py-2 transition ${
                    active ? "text-blue-600 font-semibold" : "text-black hover:text-blue-600"
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Dropdown mobile */}
<<<<<<< HEAD
            <div className="mt-2 border-t border-gray-600 pt-2">
              <p className="text-gray-300 text-sm px-2 py-1">Ressources</p>
=======
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-black text-sm px-2 py-1">Ressources</p>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
              {dropdownItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
<<<<<<< HEAD
                  className="block py-2 pl-4 text-white hover:text-blue-400 transition"
=======
                  className="block py-2 pl-4 text-black hover:text-blue-600 transition"
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <Link
              href="/login"
<<<<<<< HEAD
              className="block mt-2 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition mx-2"
=======
              className="block mt-2 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition"
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
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