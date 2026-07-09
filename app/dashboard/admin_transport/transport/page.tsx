"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithOffline } from "@/utils/fetchWithOffline";
import {
  Bus, Plus, Trash2, Edit, Users, Route,
  Search, AlertCircle,
  User, UserCheck, UserX,
  Calendar,
  BookA
} from "lucide-react";

// ⭐ Interface pour un élève inscrit
interface EleveInscrit {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  classe: string;
  date_inscription: string;
  status: string;
  ligne?: string;
  bus?: string;
}

// ⭐ Interface unifiée correspondant à la réponse de l'API
interface BusItem {
  id: number;
  immatriculation: string;
  chauffeur: string;
  chauffeur_tel?: string;
  capacite: number;
  inscrits: number;
  trajet: string;
  horaireMatin: string;
  horaireSoir: string;
  prix_abonnement: number;
  statut: string;
}

// ⭐ Interface pour les stats
interface Stats {
  totalBus: number;
  totalInscrits: number;
  tauxRemplissage: number;
  recettesMois: number;
}

export default function TransportPage() {
  const router = useRouter();
  const [bus, setBus] = useState<BusItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Élèves inscrits
  const [showElevesList, setShowElevesList] = useState(false);
  const [elevesInscrits, setElevesInscrits] = useState<EleveInscrit[]>([]);
  const [loadingEleves, setLoadingEleves] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<BusItem | null>(null);
  const [formData, setFormData] = useState({
    immatriculation: "",
    chauffeur: "",
    chauffeur_tel: "",
    capacite: 30,
    trajet: "",
    horaireMatin: "07:30",
    horaireSoir: "16:30",
    prix_abonnement: 50000
  });

  // ⭐ Récupération des données via l'API unifiée
  const fetchTransport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithOffline('/api/admin/transport', 'bus');
      setBus(data.bus || []);
      setStats(data.stats || {
        totalBus: 0,
        totalInscrits: 0,
        tauxRemplissage: 0,
        recettesMois: 0
      });
    } catch (error) {
      console.error("Erreur chargement transport:", error);
      setError("Impossible de charger les données du transport");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Récupération de la liste des élèves inscrits au transport
  const fetchElevesInscrits = async () => {
    setLoadingEleves(true);
    try {
      const data = await fetchWithOffline('/api/admin/transport/eleves-inscrits', 'eleves');
      if (data && data.eleves) {
        setElevesInscrits(data.eleves || []);
        setShowElevesList(true);
      } else {
        console.warn("API élèves inscrits non disponible, utilisation des données mockées");
        setElevesInscrits([
          {
            id: 1,
            nom: "Camara",
            prenom: "Mohamed",
            matricule: "ELE-1782656025968-493",
            classe: "3EME ANNEE",
            date_inscription: "2026-06-28",
            status: "actif"
          },
          {
            id: 2,
            nom: "AA",
            prenom: "AA",
            matricule: "ELE-1782730225235-816",
            classe: "7EME ANNEE",
            date_inscription: "2026-06-29",
            status: "actif"
          }
        ]);
        setShowElevesList(true);
      }
    } catch (error) {
      console.error("Erreur chargement élèves inscrits:", error);
      setElevesInscrits([]);
      setShowElevesList(true);
    } finally {
      setLoadingEleves(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, []);

  // ⭐ Ouvrir le formulaire d'ajout
  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({
      immatriculation: "",
      chauffeur: "",
      chauffeur_tel: "",
      capacite: 30,
      trajet: "",
      horaireMatin: "07:30",
      horaireSoir: "16:30",
      prix_abonnement: 50000
    });
    setShowForm(true);
  };

  // ⭐ Ouvrir le formulaire d'édition avec les données du bus
  const handleOpenEdit = (item: BusItem) => {
    setEditingBus(item);
    setFormData({
      immatriculation: item.immatriculation,
      chauffeur: item.chauffeur === "Non assigné" ? "" : item.chauffeur,
      chauffeur_tel: item.chauffeur_tel || "",
      capacite: item.capacite,
      trajet: item.trajet === "Aucun trajet" ? "" : item.trajet,
      horaireMatin: item.horaireMatin === "-" ? "07:30" : item.horaireMatin,
      horaireSoir: item.horaireSoir === "-" ? "16:30" : item.horaireSoir,
      prix_abonnement: item.prix_abonnement || 50000
    });
    setShowForm(true);
  };

  // ⭐ Soumission du formulaire (Ajout ou Modification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBus ? "PUT" : "POST";
      const body = editingBus ? { ...formData, id: editingBus.id } : formData;

      const response = await fetch('/api/admin/transport', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowForm(false);
        fetchTransport();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement du bus");
      }
    } catch (error) {
      console.error("Erreur soumission transport:", error);
      alert("Erreur de connexion au serveur");
    }
  };

  // ⭐ Suppression d'un bus
  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce bus et sa ligne associée ?")) {
      try {
        const response = await fetch(`/api/admin/transport?id=${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchTransport();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur suppression transport:", error);
      }
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bus className="w-7 h-7 text-purple-600" />
            Gestion des Transports
          </h1>
          <p className="text-gray-500 mt-1">Gérez les bus, trajets et inscriptions</p>
        </div>
        
        {/* ⭐ Groupe de boutons avec espacement réduit */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/admin_transport/presences"
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            Présences
          </Link>
           <Link
            href="/dashboard/admin_transport/rapports"
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <BookA className="w-4 h-4" />
            Rapports
          </Link>
          <button
            onClick={handleOpenAdd}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ajouter un bus
          </button>
        </div>
      </div>

      {/* ⭐ Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ⭐ Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Bus en service</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalBus}</p>
            </div>
            <Bus className="w-8 h-8 text-blue-200" />
          </div>
          
          {/* ⭐ Carte "Élèves inscrits" cliquable */}
          <div 
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-md transition"
            onClick={fetchElevesInscrits}
          >
            <div>
              <p className="text-gray-500 text-sm">Élèves inscrits</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalInscrits}</p>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Taux remplissage</p>
              <p className="text-2xl font-bold text-orange-600">{stats.tauxRemplissage}%</p>
            </div>
            <Route className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      )}

      {/* ⭐ Modal / Section des élèves inscrits */}
      {showElevesList && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* En-tête du modal */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-green-600" />
                  Élèves inscrits au transport
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Total : {elevesInscrits.length} élèves
                </p>
              </div>
              <button 
                onClick={() => setShowElevesList(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingEleves ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : elevesInscrits.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <UserX className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600">Aucun élève inscrit au transport</p>
                  <p className="text-sm mt-1">Les inscriptions au transport apparaîtront ici</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Matricule</th>
                        <th className="px-4 py-3 text-left">Nom & Prénom</th>
                        <th className="px-4 py-3 text-left">Classe</th>
                        <th className="px-4 py-3 text-left">Date d'inscription</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {elevesInscrits.map((eleve) => (
                        <tr key={eleve.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {eleve.matricule}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {eleve.prenom} {eleve.nom}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {eleve.classe}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(eleve.date_inscription).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <UserCheck className="w-3 h-3" />
                              {eleve.status === 'actif' ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pied du modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {elevesInscrits.length} élève{elevesInscrits.length > 1 ? 's' : ''} inscrit{elevesInscrits.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowElevesList(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des bus */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Liste des bus et trajets</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Immatriculation</th>
                <th className="px-6 py-3">Chauffeur</th>
                <th className="px-6 py-3">Trajet</th>
                <th className="px-6 py-3">Horaires</th>
                <th className="px-6 py-3">Élèves / Capacité</th>
                <th className="px-6 py-3">Prix</th>
                <th className="px-6 py-3">Taux</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bus.map((b) => {
                const filledRatio = b.capacite > 0 ? Math.round((b.inscrits / b.capacite) * 100) : 0;
                return (
                  <tr key={b.id} className="hover:bg-purple-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {b.immatriculation}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{b.chauffeur}</div>
                      {b.chauffeur_tel && <div className="text-gray-500 text-xs">{b.chauffeur_tel}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                        <Route className="w-3 h-3" /> {b.trajet}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div>Matin: {b.horaireMatin}</div>
                      <div>Soir: {b.horaireSoir}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{b.inscrits}</span>
                      <span className="text-gray-500"> / {b.capacite} places</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {(b.prix_abonnement || 0).toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${filledRatio > 90 ? 'bg-red-500' : filledRatio > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, filledRatio)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{filledRatio}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(b)} 
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(b.id)} 
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bus.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Bus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucun bus disponible</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter un bus" pour commencer</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBus ? "Modifier le bus" : "Ajouter un bus"}
              </h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="sr-only">Fermer</span>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Immatriculation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plaque d'immatriculation *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: SC2332"
                  value={formData.immatriculation}
                  onChange={e => setFormData({ ...formData, immatriculation: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Chauffeur et Téléphone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chauffeur *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nom complet"
                    value={formData.chauffeur}
                    onChange={e => setFormData({ ...formData, chauffeur: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 610093486"
                    value={formData.chauffeur_tel}
                    onChange={e => setFormData({ ...formData, chauffeur_tel: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Capacité et Prix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacité (places) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.capacite}
                    onChange={e => setFormData({ ...formData, capacite: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix abonnement (GNF) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ex: 50000"
                    value={formData.prix_abonnement}
                    onChange={e => setFormData({ ...formData, prix_abonnement: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Trajet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Trajet *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: COYAH - SANOYAH"
                  value={formData.trajet}
                  onChange={e => setFormData({ ...formData, trajet: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horaire Matin
                  </label>
                  <input
                    type="time"
                    value={formData.horaireMatin}
                    onChange={e => setFormData({ ...formData, horaireMatin: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horaire Soir
                  </label>
                  <input
                    type="time"
                    value={formData.horaireSoir}
                    onChange={e => setFormData({ ...formData, horaireSoir: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition shadow-sm"
                >
                  {editingBus ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}