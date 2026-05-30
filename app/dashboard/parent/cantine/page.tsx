// app/dashboard/parent/cantine/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Utensils, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
  Heart
} from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  inscritCantine: boolean;
  solde?: number;
  menusReserves?: number;
  preferences?: string[];
}

interface Menu {
  id: number;
  date: string;
  jour: string;
  plat: string;
  accompagnement: string;
  dessert: string;
  prix: number;
  allergenes?: string[];
  calories?: number;
}

interface Reservation {
  id: number;
  enfantId: number;
  date: string;
  menuId: number;
  statut: "confirmee" | "annulee" | "en_attente";
  paye: boolean;
}

export default function ParentCantinePage() {
  const [selectedEnfant, setSelectedEnfant] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showResume, setShowResume] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Liste des enfants
  const enfants: Enfant[] = [
    { 
      id: 1, 
      nom: "Diallo", 
      prenom: "Ibrahim", 
      classe: "5ème A", 
      inscritCantine: true,
      solde: 25000,
      menusReserves: 3,
      preferences: ["Sans porc", "Éviter arachides"]
    },
    { 
      id: 2, 
      nom: "Diallo", 
      prenom: "Aïssatou", 
      classe: "3ème A", 
      inscritCantine: true,
      solde: 15000,
      menusReserves: 2,
      preferences: ["Végétarien"]
    },
    { 
      id: 3, 
      nom: "Diallo", 
      prenom: "Mamadou", 
      classe: "6ème A", 
      inscritCantine: false 
    },
  ];

  // Menus de la semaine
  const menus: Menu[] = [
    { id: 1, date: "2025-05-26", jour: "Lundi", plat: "Riz au gras", accompagnement: "Légumes sautés", dessert: "Fruit de saison", prix: 5000 },
    { id: 2, date: "2025-05-27", jour: "Mardi", plat: "Poisson braisé", accompagnement: "Frites maison", dessert: "Yaourt", prix: 5500 },
    { id: 3, date: "2025-05-28", jour: "Mercredi", plat: "Poulet DG", accompagnement: "Bananes plantain", dessert: "Glace", prix: 6000 },
    { id: 4, date: "2025-05-29", jour: "Jeudi", plat: "Mafé", accompagnement: "Riz blanc", dessert: "Compote", prix: 5500 },
    { id: 5, date: "2025-05-30", jour: "Vendredi", plat: "Omelette", accompagnement: "Frites", dessert: "Fruit", prix: 4500 },
  ];

  // Réservations existantes
  const [reservations, setReservations] = useState<Reservation[]>([
    { id: 1, enfantId: 1, date: "2025-05-26", menuId: 1, statut: "confirmee", paye: true },
    { id: 2, enfantId: 1, date: "2025-05-27", menuId: 2, statut: "confirmee", paye: true },
    { id: 3, enfantId: 2, date: "2025-05-26", menuId: 1, statut: "confirmee", paye: true },
  ]);

  const enfant = enfants.find(e => e.id === selectedEnfant);
  const enfantInscrit = enfant?.inscritCantine;
  const enfantReservations = reservations.filter(r => r.enfantId === selectedEnfant);
  const totalReservations = enfantReservations.length;
  const totalAPayer = enfantReservations.reduce((acc, r) => {
    const menu = menus.find(m => m.id === r.menuId);
    return acc + (menu?.prix || 0);
  }, 0);

  const handleQuantityChange = (menuId: number, delta: number) => {
    const current = quantities[menuId] || 0;
    const newQuantity = Math.max(0, current + delta);
    if (newQuantity === 0) {
      const newQuantities = { ...quantities };
      delete newQuantities[menuId];
      setQuantities(newQuantities);
    } else {
      setQuantities({ ...quantities, [menuId]: newQuantity });
    }
  };

  const handleReserve = () => {
    const newReservations = [...reservations];
    Object.entries(quantities).forEach(([menuId, qty]) => {
      for (let i = 0; i < qty; i++) {
        newReservations.push({
          id: Date.now() + i,
          enfantId: selectedEnfant,
          date: menus.find(m => m.id === parseInt(menuId))?.date || "",
          menuId: parseInt(menuId),
          statut: "confirmee",
          paye: false
        });
      }
    });
    setReservations(newReservations);
    setQuantities({});
    setShowResume(false);
  };

  const handleCancelReservation = (reservationId: number) => {
    setReservations(reservations.filter(r => r.id !== reservationId));
  };

  const getMenuForReservation = (menuId: number) => menus.find(m => m.id === menuId);

  if (!enfantInscrit) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Cantine scolaire</h1><p className="text-gray-500">Gérez les repas de vos enfants</p></div>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucun enfant inscrit à la cantine</h2>
          <p className="text-gray-500 mb-6">Votre enfant n'est pas encore inscrit au service de restauration scolaire.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            S'inscrire à la cantine
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cantine scolaire</h1>
          <p className="text-gray-500">Gérez les repas de vos enfants</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowResume(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Réserver
          </button>
        </div>
      </div>

      {/* Sélection de l'enfant */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        {enfants.filter(e => e.inscritCantine).map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedEnfant(e.id)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedEnfant === e.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {e.prenom} {e.nom} - {e.classe}
          </button>
        ))}
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Solde disponible</p>
          <p className="text-2xl font-bold">{enfant?.solde?.toLocaleString()} GNF</p>
          <button className="mt-2 text-sm underline opacity-80">Recharger</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Repas réservés</p><p className="text-2xl font-bold text-green-600">{totalReservations}</p></div>
            <Utensils className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Total à payer</p><p className="text-2xl font-bold text-orange-600">{totalAPayer.toLocaleString()} GNF</p></div>
            <CreditCard className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Préférences alimentaires */}
      {enfant?.preferences && enfant.preferences.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">Préférences alimentaires</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {enfant.preferences.map((pref, idx) => (
                  <span key={idx} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">{pref}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menus de la semaine */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">Menus de la semaine</h3>
        </div>
        <div className="divide-y">
          {menus.map((menu) => {
            const isReserved = enfantReservations.some(r => r.menuId === menu.id);
            return (
              <div key={menu.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-blue-600">{menu.jour}</span>
                      <span className="text-xs text-gray-400">{menu.date}</span>
                    </div>
                    <p className="font-medium text-gray-800">{menu.plat}</p>
                    <p className="text-sm text-gray-500">{menu.accompagnement} • {menu.dessert}</p>
                    <p className="text-sm font-medium text-green-600 mt-1">{menu.prix.toLocaleString()} GNF</p>
                  </div>
                  <div className="text-right">
                    {isReserved ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Réservé</span>
                        <button 
                          onClick={() => {
                            const reservation = enfantReservations.find(r => r.menuId === menu.id);
                            if (reservation) handleCancelReservation(reservation.id);
                          }}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleQuantityChange(menu.id, -1)}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                          disabled={!quantities[menu.id]}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{quantities[menu.id] || 0}</span>
                        <button 
                          onClick={() => handleQuantityChange(menu.id, 1)}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal réservation */}
      {showResume && Object.keys(quantities).length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Confirmer la réservation</h2>
              <button onClick={() => setShowResume(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-3">
                {Object.entries(quantities).map(([menuId, qty]) => {
                  const menu = menus.find(m => m.id === parseInt(menuId));
                  return (
                    <div key={menuId} className="flex justify-between items-center">
                      <div><p className="font-medium">{menu?.jour}</p><p className="text-sm text-gray-500">{menu?.plat}</p></div>
                      <div className="text-right"><p className="font-medium">{qty} x {menu?.prix.toLocaleString()} GNF</p><p className="text-sm text-gray-500">{(qty * (menu?.prix || 0)).toLocaleString()} GNF</p></div>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span>{Object.entries(quantities).reduce((acc, [menuId, qty]) => {
                      const menu = menus.find(m => m.id === parseInt(menuId));
                      return acc + (qty * (menu?.prix || 0));
                    }, 0).toLocaleString()} GNF</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowResume(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handleReserve} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}