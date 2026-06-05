// app/dashboard/parent/cantine/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Utensils,
  MapPin,
  Clock,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Bell,
  Phone,
  Loader2,
  CreditCard,
  TrendingUp,
  Wallet,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  X
} from "lucide-react";

interface Enfant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  inscritCantine: boolean;
  solde?: number;
  preferences?: string[];
  allergies?: string[];
  menuReserve?: string;
  heureRepas?: string;
  responsable?: string;
  responsableTel?: string;
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

interface StatsCantine {
  totalEleves: number;
  inscritsCantine: number;
  fraisTotalCantine: number;
  fraisPayesCantine: number;
  fraisRestantsCantine: number;
  repasServisMois: number;
}

interface Reservation {
  id: number;
  enfantId: number;
  date: string;
  menuId: number;
  statut: string;
  paye: boolean;
}

export default function ParentCantinePage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<StatsCantine>({
    totalEleves: 0,
    inscritsCantine: 0,
    fraisTotalCantine: 0,
    fraisPayesCantine: 0,
    fraisRestantsCantine: 0,
    repasServisMois: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedEnfantId, setSelectedEnfantId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showResume, setShowResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCantineData();
  }, []);

  const fetchCantineData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/parent/cantine");
      const data = await response.json();

      const enfantsData = data.enfants || [];
      const menusData = data.menus || [];
      const reservationsData = data.reservations || [];

      setEnfants(enfantsData);
      setMenus(menusData);
      setReservations(reservationsData);

      // Calculer les statistiques
      const inscrits = enfantsData.filter((e: Enfant) => e.inscritCantine).length;
      const fraisParEnfant = 25000;
      const totalFrais = inscrits * fraisParEnfant;
      const payes = inscrits > 0 ? Math.floor(totalFrais * 0.7) : 0;
      const repasMois = reservationsData.filter((r: Reservation) => {
        const dateRes = new Date(r.date);
        const now = new Date();
        return dateRes.getMonth() === now.getMonth() && dateRes.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalEleves: enfantsData.length,
        inscritsCantine: inscrits,
        fraisTotalCantine: totalFrais,
        fraisPayesCantine: payes,
        fraisRestantsCantine: totalFrais - payes,
        repasServisMois: repasMois
      });

      if (enfantsData.length > 0 && !selectedEnfantId) {
        setSelectedEnfantId(enfantsData[0].id);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCantineData().finally(() => setRefreshing(false));
  };

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

  const handleReserve = async () => {
    if (!selectedEnfantId) return;

    try {
      setSubmitting(true);

      const menuIds = Object.keys(quantities).map(id => parseInt(id));
      const total = Object.entries(quantities).reduce((acc, [menuId, qty]) => {
        const menu = menus.find(m => m.id === parseInt(menuId));
        return acc + (qty * (menu?.prix || 0));
      }, 0);

      const response = await fetch("/api/parent/cantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enfantId: selectedEnfantId,
          menuIds: menuIds,
          quantities: quantities,
          total: total
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la réservation");
      }

      await fetchCantineData();
      setQuantities({});
      setShowResume(false);
      alert("Réservation confirmée !");

    } catch (err) {
      console.error("Erreur:", err);
      alert(err instanceof Error ? err.message : "Erreur lors de la réservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm("Annuler cette réservation ?")) return;

    try {
      const response = await fetch("/api/parent/cantine", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, enfantId: selectedEnfantId }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'annulation");

      await fetchCantineData();
      alert("Réservation annulée avec succès");

    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de l'annulation");
    }
  };

  const enfant = enfants.find(e => e.id === selectedEnfantId);
  const enfantsInscrits = enfants.filter(e => e.inscritCantine);
  const enfantReservations = reservations.filter(r => r.enfantId === selectedEnfantId);
  const totalQuantities = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalAPayer = enfantReservations.reduce((acc, r) => {
    const menu = menus.find(m => m.id === r.menuId);
    return acc + (menu?.prix || 0);
  }, 0);

  const getJourSemaine = (date: string) => {
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return jours[new Date(date).getDay()];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cantine scolaire</h1>
          <p className="text-gray-900">Gérez les repas de vos enfants et réservez les menus</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-5 h-5 text-gray-900 ${refreshing ? "animate-spin" : ""}`} />
          <span className="text-sm text-gray-900">Actualiser</span>
        </button>
      </div>

      {/* Statistiques Cantine */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Total élèves</p></div>
          <p className="text-3xl font-bold">{stats.totalEleves}</p>
          <p className="text-xs opacity-75">dont {stats.inscritsCantine} inscrits à la cantine</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Utensils className="w-5 h-5" /><p className="text-sm">Repas servis</p></div>
          <p className="text-2xl font-bold text-orange-600">{stats.repasServisMois}</p>
          <p className="text-xs text-gray-900">ce mois-ci</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5" /><p className="text-sm">Frais cantine</p></div>
          <p className="text-lg font-bold text-green-600">{stats.fraisTotalCantine.toLocaleString()} GNF</p>
          <p className="text-xs text-gray-900">Payé: {stats.fraisPayesCantine.toLocaleString()} GNF</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><TrendingUp className="w-5 h-5" /><p className="text-sm">Taux paiement</p></div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.fraisTotalCantine > 0 ? Math.round((stats.fraisPayesCantine / stats.fraisTotalCantine) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Barre de progression des paiements cantine */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-900">Progression des paiements cantine</span>
          <span className="font-medium text-orange-600">
            {stats.fraisTotalCantine > 0 ? Math.round((stats.fraisPayesCantine / stats.fraisTotalCantine) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${stats.fraisTotalCantine > 0 ? (stats.fraisPayesCantine / stats.fraisTotalCantine) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Sélection de l'enfant */}
      {enfantsInscrits.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
          <span className="text-sm text-gray-900 flex items-center gap-1 mr-2">
            <Users className="w-4 h-4" /> Enfants inscrits:
          </span>
          {enfantsInscrits.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEnfantId(e.id)}
              className={`px-4 py-2 rounded-lg transition ${selectedEnfantId === e.id
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
            >
              {e.prenom} {e.nom}
            </button>
          ))}
        </div>
      )}

      {/* Message si aucun enfant inscrit */}
      {enfantsInscrits.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <Utensils className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Aucun enfant inscrit à la cantine</h3>
          <p className="text-yellow-700 mb-4">
            Vos enfants ne sont pas encore inscrits au service de restauration scolaire.
            Vous pouvez les inscrire en cliquant sur le bouton ci-dessous.
          </p>
          <Link
            href="/dashboard/parent/inscriptions"
            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            S'inscrire à la cantine
          </Link>
        </div>
      )}

      {/* Détails de la cantine pour un enfant inscrit */}
      {enfant && enfant.inscritCantine && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Informations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Statut du service cantine */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  Statut du service
                </h3>
                {enfant.solde && enfant.solde < 5000 ? (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Solde faible
                  </span>
                ) : (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Actif
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-sm">Solde disponible</span>
                  <span className="font-medium text-green-600">{enfant.solde?.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-sm">Repas réservés</span>
                  <span className="font-medium">{enfantReservations.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-sm">Total à payer</span>
                  <span className="font-medium text-orange-600">{totalAPayer.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-sm">Responsable cantine</span>
                  <span className="font-medium">Mme. Touré</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-sm">Contact</span>
                  <a href="tel:+224620000000" className="text-orange-600 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 6200 00 00
                  </a>
                </div>
              </div>
            </div>

            {/* Horaires des repas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                Horaires des repas
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Déjeuner</p>
                    <p className="text-xl font-bold text-orange-600">12:30</p>
                  </div>
                  <div className="text-">→</div>
                  <div>
                    <p className="text-sm text-gray-900">Goûter</p>
                    <p className="text-xl font-bold text-orange-600">16:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Préférences alimentaires */}
            {(enfant.preferences && enfant.preferences.length > 0) || (enfant.allergies && enfant.allergies.length > 0) ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-800 flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5" />
                  Informations alimentaires
                </h3>
                {enfant.preferences && enfant.preferences.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-yellow-700 font-medium mb-2">Préférences :</p>
                    <div className="flex flex-wrap gap-2">
                      {enfant.preferences.map((pref, idx) => (
                        <span key={idx} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">{pref}</span>
                      ))}
                    </div>
                  </div>
                )}
                {enfant.allergies && enfant.allergies.length > 0 && (
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-2">Allergies :</p>
                    <div className="flex flex-wrap gap-2">
                      {enfant.allergies.map((allergie, idx) => (
                        <span key={idx} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{allergie}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Colonne de droite - Menus et réservations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Menus de la semaine */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Menus de la semaine</h3>
                    <p className="text-sm opacity-90">Choisissez les repas pour {enfant.prenom}</p>
                  </div>
                  <button
                    onClick={() => setShowResume(true)}
                    disabled={totalQuantities === 0}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${totalQuantities > 0
                      ? "bg-white text-orange-600 hover:bg-gray-100"
                      : "bg-white/50 text-orange-400 cursor-not-allowed"
                      }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Réserver ({totalQuantities})
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {menus.map((menu) => {
                  const isReserved = enfantReservations.some(r => r.menuId === menu.id);
                  const menuDate = new Date(menu.date);
                  const isPastDate = menuDate < new Date();
                  const currentQuantity = quantities[menu.id] || 0;

                  return (
                    <div key={menu.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-orange-600">
                              {getJourSemaine(menu.date)}
                            </span>
                            <span className="text-xs text-gray-900">
                              {new Date(menu.date).toLocaleDateString('fr-FR')}
                            </span>
                            {menu.calories && (
                              <span className="text-xs text-">{menu.calories} cal</span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{menu.plat}</p>
                          <p className="text-sm text-gray-900">
                            {menu.accompagnement} • {menu.dessert}
                          </p>
                          {menu.allergenes && menu.allergenes.length > 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Allergènes: {menu.allergenes.join(', ')}
                            </p>
                          )}
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {menu.prix.toLocaleString()} GNF
                          </p>
                        </div>
                        <div className="text-right">
                          {isReserved ? (
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Réservé
                              </span>
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
                              {!isPastDate ? (
                                <>
                                  <button
                                    onClick={() => handleQuantityChange(menu.id, -1)}
                                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                    disabled={currentQuantity === 0}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium">
                                    {currentQuantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(menu.id, 1)}
                                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-sm text-">Passé</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Présence du jour */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                Repas du jour
              </h3>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-900">Statut déjeuner</p>
                  <p className="text-lg font-semibold text-green-600">✅ Réservé</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">Menu du jour</p>
                  <p className="font-medium">{menus[0]?.plat || "Riz au gras"}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" /> Activer les rappels
                </button>
                <button className="flex-1 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Historique
                </button>
              </div>
            </div>

            {/* Alerte si solde faible */}
            {enfant.solde && enfant.solde < 10000 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Solde faible</h4>
                    <p className="text-sm text-yellow-700">
                      Votre solde est inférieur à 10 000 GNF. Pensez à recharger pour continuer à réserver des repas.
                    </p>
                    <Link
                      href="/dashboard/parent/rechargement"
                      className="mt-2 inline-block text-sm text-yellow-700 font-medium hover:underline"
                    >
                      Recharger maintenant →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal réservation */}
      {showResume && totalQuantities > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Confirmer la réservation</h2>
              <button
                onClick={() => setShowResume(false)}
                className="text- hover:text-gray-900"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-3">
                {Object.entries(quantities).map(([menuId, qty]) => {
                  const menu = menus.find(m => m.id === parseInt(menuId));
                  if (!menu) return null;
                  return (
                    <div key={menuId} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{getJourSemaine(menu.date)}</p>
                        <p className="text-sm text-gray-900">{menu.plat}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{qty} x {menu.prix.toLocaleString()} GNF</p>
                        <p className="text-sm text-gray-900">{(qty * menu.prix).toLocaleString()} GNF</p>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span className="text-lg text-orange-600">
                      {Object.entries(quantities).reduce((acc, [menuId, qty]) => {
                        const menu = menus.find(m => m.id === parseInt(menuId));
                        return acc + (qty * (menu?.prix || 0));
                      }, 0).toLocaleString()} GNF
                    </span>
                  </div>
                  {enfant && enfant.solde && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-900">Solde actuel</span>
                      <span className={`font-medium ${enfant.solde >= Object.entries(quantities).reduce((acc, [menuId, qty]) => {
                        const menu = menus.find(m => m.id === parseInt(menuId));
                        return acc + (qty * (menu?.prix || 0));
                      }, 0) ? 'text-green-600' : 'text-red-600'}`}>
                        {enfant.solde.toLocaleString()} GNF
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowResume(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={handleReserve}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}