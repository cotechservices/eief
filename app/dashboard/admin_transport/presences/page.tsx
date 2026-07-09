//app/dashboard/admin_transport/presences/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithOffline } from "@/utils/fetchWithOffline";
import { 
  Bus, Users, Calendar, Check, X, Clock, Search, 
  Filter, ChevronLeft, ChevronRight, UserCheck, UserX,
  AlertCircle, Download, Printer
} from "lucide-react";

interface EleveTransport {
  id: number;
  eleve_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  ligne: string;
  bus: string;
  date_debut: string;
  est_actif: boolean;
}

interface Presence {
  eleve_id: number;
  date: string;
  statut: 'present' | 'absent' | 'retard';
  heure_arrivee?: string;
  commentaire?: string;
}

export default function PresencesTransportPage() {
  const router = useRouter();
  const [eleves, setEleves] = useState<EleveTransport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [presences, setPresences] = useState<Presence[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLigne, setFilterLigne] = useState<string>("");
  const [lignes, setLignes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // ⭐ Récupérer les élèves inscrits au transport
  const fetchElevesTransport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithOffline('/api/admin/transport/eleves-inscrits', 'eleves');
      setEleves(data.eleves || []);
      
      // Extraire les lignes uniques pour le filtre
      const uniqueLignes = [...new Set(data.eleves.map((e: any) => e.ligne || 'Sans ligne'))];
      setLignes(uniqueLignes);
      
      // Initialiser les présences
      const initialPresences = (data.eleves || []).map((e: any) => ({
        eleve_id: e.id,
        date: selectedDate,
        statut: 'present' as const,
        heure_arrivee: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }));
      setPresences(initialPresences);
      
    } catch (error) {
      console.error("Erreur chargement élèves:", error);
      setError("Impossible de charger la liste des élèves");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Charger les présences existantes pour la date sélectionnée
  const fetchPresencesExistantes = async () => {
    try {
      const data = await fetchWithOffline(`/api/admin/transport/presences?date=${selectedDate}`, 'presences');
      if (data.presences && data.presences.length > 0) {
          // Mettre à jour les présences existantes
          const updatedPresences = presences.map(p => {
            const existing = data.presences.find((ep: any) => ep.eleve_id === p.eleve_id);
            return existing || p;
          });
          setPresences(updatedPresences);
      }
    } catch (error) {
      console.error("Erreur chargement présences existantes:", error);
    }
  };

  useEffect(() => {
    fetchElevesTransport();
  }, []);

  useEffect(() => {
    if (eleves.length > 0) {
      // Réinitialiser les présences quand la date change
      const initialPresences = eleves.map(e => ({
        eleve_id: e.id,
        date: selectedDate,
        statut: 'present' as const,
        heure_arrivee: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }));
      setPresences(initialPresences);
      fetchPresencesExistantes();
    }
  }, [selectedDate]);

  // ⭐ Changer le statut d'un élève
  const toggleStatut = (eleveId: number, statut: 'present' | 'absent' | 'retard') => {
    setPresences(prev => 
      prev.map(p => 
        p.eleve_id === eleveId 
          ? { ...p, statut, heure_arrivee: statut !== 'absent' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined }
          : p
      )
    );
  };

  // ⭐ Marquer tous comme présents
  const marquerTousPresents = () => {
    setPresences(prev => 
      prev.map(p => ({ 
        ...p, 
        statut: 'present',
        heure_arrivee: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }))
    );
  };

  // ⭐ Sauvegarder les présences
  const sauvegarderPresences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/transport/presences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          presences: presences
        })
      });

      if (response.ok) {
        alert("Présences sauvegardées avec succès !");
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des présences");
    } finally {
      setSaving(false);
    }
  };

  // ⭐ Statistiques du jour
  const stats = {
    total: eleves.length,
    presents: presences.filter(p => p.statut === 'present').length,
    absents: presences.filter(p => p.statut === 'absent').length,
    retards: presences.filter(p => p.statut === 'retard').length,
  };

  // Filtrage des élèves
  const elevesFiltres = eleves.filter(e => {
    const matchSearch = 
      e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLigne = filterLigne === "" || e.ligne === filterLigne;
    return matchSearch && matchLigne;
  });

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
            Gestion des Présences - Transport
          </h1>
          <p className="text-gray-500 mt-1">Gérez les présences des élèves dans les bus</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={sauvegarderPresences}
            disabled={saving}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>

      {/* ⭐ Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total élèves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Présents</p>
              <p className="text-2xl font-bold text-green-600">{stats.presents}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Absents</p>
              <p className="text-2xl font-bold text-red-600">{stats.absents}</p>
            </div>
            <UserX className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Retards</p>
              <p className="text-2xl font-bold text-orange-600">{stats.retards}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* ⭐ Filtres et actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterLigne}
            onChange={(e) => setFilterLigne(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Toutes les lignes</option>
            {lignes.map((ligne) => (
              <option key={ligne} value={ligne}>{ligne}</option>
            ))}
          </select>
          <button
            onClick={marquerTousPresents}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Tout présents
          </button>
        </div>
      </div>

      {/* ⭐ Liste des élèves */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matricule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Classe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ligne / Bus</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Heure</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {elevesFiltres.map((eleve) => {
                const presence = presences.find(p => p.eleve_id === eleve.id);
                const statut = presence?.statut || 'present';
                const heure = presence?.heure_arrivee || '-';
                
                return (
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
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <div>{eleve.ligne || 'Sans ligne'}</div>
                      <div className="text-gray-400">{eleve.bus || 'Sans bus'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${statut === 'present' ? 'bg-green-100 text-green-700' : ''}
                        ${statut === 'absent' ? 'bg-red-100 text-red-700' : ''}
                        ${statut === 'retard' ? 'bg-orange-100 text-orange-700' : ''}
                      `}>
                        {statut === 'present' && <UserCheck className="w-3 h-3" />}
                        {statut === 'absent' && <UserX className="w-3 h-3" />}
                        {statut === 'retard' && <Clock className="w-3 h-3" />}
                        {statut === 'present' ? 'Présent' : statut === 'absent' ? 'Absent' : 'Retard'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {heure}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleStatut(eleve.id, 'present')}
                          className={`p-1.5 rounded-lg transition ${
                            statut === 'present' 
                              ? 'bg-green-100 text-green-700' 
                              : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                          }`}
                          title="Présent"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatut(eleve.id, 'retard')}
                          className={`p-1.5 rounded-lg transition ${
                            statut === 'retard' 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'hover:bg-orange-50 text-gray-400 hover:text-orange-600'
                          }`}
                          title="Retard"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatut(eleve.id, 'absent')}
                          className={`p-1.5 rounded-lg transition ${
                            statut === 'absent' 
                              ? 'bg-red-100 text-red-700' 
                              : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                          }`}
                          title="Absent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {elevesFiltres.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucun élève trouvé</p>
                    <p className="text-sm mt-1">Aucun élève ne correspond à vos critères</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}