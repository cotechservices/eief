// app/dashboard/admin/eleves/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Plus, Edit, Trash2, Eye,
  Download, Printer, ChevronLeft, ChevronRight,
  GraduationCap, Calendar, MapPin, Phone, Mail, User,
  CheckCircle, XCircle, AlertCircle
} from "lucide-react";

interface Eleve {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  classe: string;
  niveau: string;
  parent: string;
  parentTel: string;
  parentEmail: string;
  dateInscription: string;
  statut: "actif" | "inactif" | "suspendu";
}

export default function GestionElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClasse, setSelectedClasse] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    setTimeout(() => {
      const mockEleves: Eleve[] = [
        { id: 1, matricule: "EIEF-2025-0001", nom: "Diallo", prenom: "Ibrahim", dateNaissance: "2012-05-15", lieuNaissance: "Conakry", sexe: "M", classe: "5ème A", niveau: "Primaire", parent: "M. Diallo", parentTel: "+224 622 123 456", parentEmail: "diallo@email.com", dateInscription: "2025-09-01", statut: "actif" },
        { id: 2, matricule: "EIEF-2025-0002", nom: "Souaré", prenom: "Aïssatou", dateNaissance: "2013-02-20", lieuNaissance: "Kindia", sexe: "F", classe: "3ème A", niveau: "Collège", parent: "Mme Souaré", parentTel: "+224 622 234 567", parentEmail: "souare@email.com", dateInscription: "2025-09-01", statut: "actif" },
        { id: 3, matricule: "EIEF-2025-0003", nom: "Konaté", prenom: "Mamadou", dateNaissance: "2007-11-10", lieuNaissance: "Conakry", sexe: "M", classe: "Terminale", niveau: "Lycée", parent: "M. Konaté", parentTel: "+224 622 345 678", parentEmail: "konate@email.com", dateInscription: "2025-09-01", statut: "actif" },
      ];
      setEleves(mockEleves);
      setLoading(false);
    }, 500);
  }, []);

  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch =
      eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClasse = selectedClasse === "all" || eleve.classe === selectedClasse;
    const matchesStatut = selectedStatut === "all" || eleve.statut === selectedStatut;
    return matchesSearch && matchesClasse && matchesStatut;
  });

  const totalPages = Math.ceil(filteredEleves.length / itemsPerPage);
  const paginatedEleves = filteredEleves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const classes = ["all", ...new Set(eleves.map(e => e.classe))];

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif": return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif": return <span className="text-gray-900 text-sm flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      case "suspendu": return <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Suspendu</span>;
      default: return <span>{statut}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement des élèves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des élèves</h1>
          <p className="text-gray-900">Gérez tous les élèves de l'école</p>
        </div>
        <button
          onClick={() => { setEditingEleve(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvel élève
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Toutes les classes</option>
            {classes.filter(c => c !== "all").map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Nom & Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEleves.map((eleve) => (
                <tr key={eleve.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{eleve.matricule}</td>
                  <td className="px-6 py-4 font-medium">{eleve.prenom} {eleve.nom}</td>
                  <td className="px-6 py-4">{eleve.classe}</td>
                  <td className="px-6 py-4">{eleve.parent}</td>
                  <td className="px-6 py-4">{getStatutBadge(eleve.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedEleve(eleve); setShowDetailModal(true); }} className="text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingEleve(eleve); setShowForm(true); }} className="text-green-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => confirm("Supprimer ?") && setEleves(eleves.filter(e => e.id !== eleve.id))} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-900">{filteredEleves.length} élèves</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg">◀</button>
            <span className="px-3 py-1">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg">▶</button>
          </div>
        </div>
      </div>

      {/* Modal détails simplifié */}
      {showDetailModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selectedEleve.prenom} {selectedEleve.nom}</h2>
            <div className="space-y-2">
              <p><strong>Matricule:</strong> {selectedEleve.matricule}</p>
              <p><strong>Classe:</strong> {selectedEleve.classe}</p>
              <p><strong>Parent:</strong> {selectedEleve.parent}</p>
              <p><strong>Téléphone:</strong> {selectedEleve.parentTel}</p>
            </div>
            <button onClick={() => setShowDetailModal(false)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}