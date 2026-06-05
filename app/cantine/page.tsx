// app/cantine/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Utensils, Calendar, ShieldCheck, Heart, Clock, DollarSign, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Menu {
  id: number;
  date: string;
  plat: string;
  accompagnement: string;
  dessert: string;
  regime_special: boolean;
}

export default function PublicCantinePage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/public/cantine');
        if (response.ok) {
          const data = await response.json();
          // Filter out past menus if needed, or sort to show closest date first
          setMenus(data || []);
        }
      } catch (error) {
        console.error("Erreur chargement menus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/55 z-10" />
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/cantine.png"
            alt="Cantine Scolaire EIEF"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <span className="bg-green-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full mb-3 inline-block">
                Alimentation Saine
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Cantine Scolaire</h1>
              <p className="text-xl text-green-50 mb-6">
                Des repas équilibrés et savoureux préparés chaque jour avec soin pour le bien-être et la croissance de nos élèves.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Horaires des repas</h3>
              <p className="text-sm text-gray-900">Service du midi ouvert de 12h00 à 13h45, organisé par niveaux pour un passage fluide.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Qualité & Hygiène</h3>
              <p className="text-sm text-gray-900">Ingrédients locaux frais sélectionnés rigoureusement. Cuisine moderne respectant les normes d'hygiène.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Tarifs abordables</h3>
              <p className="text-sm text-gray-900">Formule journalière à seulement 5,000 GNF par repas ou abonnement mensuel avantageux.</p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Utensils className="text-green-600 w-6 h-6" /> Menus de la semaine
              </h2>
              <p className="text-gray-900 text-sm mt-1">Découvrez la liste des plats équilibrés préparés par notre équipe</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-green-600" />
              <span>Mis à jour régulièrement</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed">
              <Utensils className="w-12 h-12 text-gray-900 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Aucun menu publié pour le moment.</p>
              <p className="text-gray-900 text-sm mt-1">Les menus de la semaine seront bientôt mis en ligne par l'administration.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menus.map((menu) => (
                <div key={menu.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition bg-gradient-to-br from-white to-gray-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full capitalize">
                        {formatDate(menu.date).split(' ')[0] || "Jour"}
                      </span>
                      {menu.regime_special && (
                        <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Heart className="w-3 h-3 fill-amber-500 text-amber-500" /> Régime spécial
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-900 font-semibold uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-bold text-gray-900 mb-4">{formatDate(menu.date)}</p>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-900 font-bold uppercase tracking-wider">Plat principal</p>
                        <p className="text-base font-bold text-gray-900">{menu.plat}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-900 font-bold uppercase tracking-wider">Accompagnement</p>
                        <p className="text-sm text-gray-900">{menu.accompagnement}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-900 font-bold uppercase tracking-wider">Dessert</p>
                        <p className="text-sm text-gray-900">{menu.dessert}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-900">
                    <span>Menu EIEF complet</span>
                    <span className="font-bold text-green-600">5,000 GNF</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dietary info section */}
        <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border border-green-100">
          <div>
            <span className="text-xs font-bold text-green-700 bg-white px-3 py-1 rounded-full shadow-sm mb-4 inline-block">
              Santé & Équilibre
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">À propos de nos régimes spéciaux</h2>
            <p className="text-gray-900 leading-relaxed mb-6">
              Nous portons une attention toute particulière à la santé de nos élèves. C'est pourquoi notre équipe de cuisine propose des alternatives de régime spécial (sans arachides, sans produits laitiers, végétarien, sans porc...) sur demande motivée auprès du secrétariat ou sur prescription médicale.
            </p>
            <div className="flex gap-4">
              <Link
                href="/contact"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition text-sm"
              >
                Signaler une allergie
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative h-[250px] md:h-[300px] rounded-2xl overflow-hidden shadow-lg border-2 border-white">
            <Image
              src="/img/slide3.jpg"
              alt="Repas équilibrés"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
