// app/dashboard/admin/enseignants/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Award
} from "lucide-react";

interface Enseignant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  specialite: string;
  diplome: string;
  dateEmbauche: string;
  statut: "actif" | "inactif" | "conge";
  classes: string[];
  matieres: string[];
  heuresSemaine: number;
  salaire: number;
}

interface ClasseAssignation {
  classeId: number;
  classeNom: string;
  matiereId: number;
  matiereNom: string;
  heures: number;
}

export default function GestionEnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialite, setSelectedSpecialite] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingEnseignant, setEditingEnseignant] = useState<Enseignant | null>(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState<Enseignant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [assignations, setAssignations] = useState<ClasseAssignation[]>([]);

  const itemsPerPage = 10;

  // Données simulées
  useEffect(() => {
    setTimeout(() => {
      const mockEnseignants: Enseignant[] = [
        { id: 1, matricule: "ENS-2025-001", nom: "Camara", prenom: "Mohamed", email: "m.camara@eief.edu.gn", telephone: "+224 622 123 456", adresse: "Conakry", specialite: "Mathématiques", diplome: "Master en Mathématiques", dateEmbauche: "2020-09-01", statut: "actif", classes: ["6ème A", "5ème A"], matieres: ["Mathématiques"], heuresSemaine: 18, salaire: 450000 },
        { id: 2, matricule: "ENS-2025-002", nom: "Diallo", prenom: "Aissatou", email: "a.diallo@eief.edu.gn", telephone: "+224 622 234 567", adresse: "Conakry", specialite: "Français", diplome: "Master en Lettres", dateEmbauche: "2019-09-01", statut: "actif", classes: ["6ème B", "5ème B"], matieres: ["Français"], heuresSemaine: 18, salaire: 450000 },
        { id: 3, matricule: "ENS-2025-003", nom: "Barry", prenom: "Fatoumata", email: "f.barry@eief.edu.gn", telephone: "+224 622 345 678", adresse: "Kindia", specialite: "Anglais", diplome: "Master en Anglais", dateEmbauche: "2021-09-01", statut: "actif", classes: ["4ème A", "3ème A"], matieres: ["Anglais"], heuresSemaine: 15, salaire: 420000 },
        { id: 4, matricule: "ENS-2025-004", nom: "Konaté", prenom: "Mamadou", email: "m.konate@eief.edu.gn", telephone: "+224 622 456 789", adresse: "Mamou", specialite: "Histoire-Géographie", diplome: "Master en Histoire", dateEmbauche: "2018-09-01", statut: "actif", classes: ["2nd A", "1ère A"], matieres: ["Histoire-Géo"], heuresSemaine: 16, salaire: 430000 },
        { id: 5, matricule: "ENS-2025-005", nom: "Souaré", prenom: "Aminata", email: "a.souare@eief.edu.gn", telephone: "+224 622 567 890", adresse: "Labé", specialite: "Sciences", diplome: "Master en Sciences", dateEmbauche: "2020-09-01", statut: "conge", classes: ["5ème A"], matieres: ["Sciences"], heuresSemaine: 12, salaire: 400000 },
        { id: 6, matricule: "ENS-2025-006", nom: "Touré", prenom: "Ousmane", email: "o.toure@eief.edu.gn", telephone: "+224 622 678 901", adresse: "Conakry", specialite: "Physique-Chimie", diplome: "Master en Physique", dateEmbauche: "2022-09-01", statut: "actif", classes: ["Terminale A"], matieres: ["Physique-Chimie"], heuresSemaine: 14, salaire: 440000 },
        { id: 7, matricule: "ENS-2025-007", nom: "Keita", prenom: "Mariam", email: "m.keita@eief.edu.gn", telephone: "+224 622 789 012", adresse: "Faranah", specialite: "Philosophie", diplome: "Master en Philosophie", dateEmbauche: "2019-09-01", statut: "inactif", classes: ["Terminale A"], matieres: ["Philosophie"], heuresSemaine: 8, salaire: 350000 },
      ];
      setEnseignants(mockEnseignants);
      setLoading(false);
    }, 1000);
  }, []);

  // Spécialités uniques pour le filtre
  const specialites = ["all", ...new Set(enseignants.map(e => e.specialite))];

  // Filtrage
  const filteredEnseignants = enseignants.filter(ens => {
    const matchesSearch = 
      ens.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ens.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ens.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ens.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialite = selectedSpecialite === "all" || ens.specialite === selectedSpecialite;
    const matchesStatut = selectedStatut === "all" || ens.statut === selectedStatut;
    return matchesSearch && matchesSpecialite && matchesStatut;
  });

  const totalPages = Math.ceil(filteredEnseignants.length / itemsPerPage);
  const paginatedEnseignants = filteredEnseignants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatutBadge = (statut: string) => {
    switch(statut) {
      case "actif": return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif": return <span className="text-gray-600 text-sm flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      case "conge": return <span className="text-orange-600 text-sm flex items-center gap-1"><Clock className="w-3 h-3" /> Congé</span>;
      default: return <span>{statut}</span>;
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet enseignant ?")) {
      setEnseignants(enseignants.filter(e => e.id !== id));
    }
  };

  const handleViewAssignations = (enseignant: Enseignant) => {
    setSelectedEnseignant(enseignant);
    // Simuler les assignations
    const mockAssignations: ClasseAssignation[] = [
      { classeId: 1, classeNom: "6ème A", matiereId: 1, matiereNom: "Mathématiques", heures: 4 },
      { classeId: 2, classeNom: "5ème A", matiereId: 1, matiereNom: "Mathématiques", heures: 4 },
      { classeId: 3, classeNom: "4ème A", matiereId: 1, matiereNom: "Mathématiques", heures: 3 },
    ];
    setAssignations(mockAssignations);
    setShowAssignModal(true);
  };

  const handleExport = () => {
    const headers = ["Matricule", "Nom", "Prénom", "Email", "Téléphone", "Spécialité", "Diplôme", "Statut", "Heures/semaine", "Salaire"];
    const csvData = filteredEnseignants.map(e => [
      e.matricule, e.nom, e.prenom, e.email, e.telephone, e.specialite, e.diplome, e.statut, e.heuresSemaine, e.salaire
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enseignants_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des enseignants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des enseignants</h1>
          <p className="text-gray-500">Gérez tous les enseignants de l'école</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button 
            onClick={() => { setEditingEnseignant(null); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel enseignant
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total enseignants</p><p className="text-2xl font-bold text-blue-600">{enseignants.length}</p></div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Actifs</p><p className="text-2xl font-bold text-green-600">{enseignants.filter(e => e.statut === "actif").length}</p></div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">En congé</p><p className="text-2xl font-bold text-orange-600">{enseignants.filter(e => e.statut === "conge").length}</p></div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Heures/semaine</p><p className="text-2xl font-bold text-purple-600">{enseignants.reduce((acc, e) => acc + e.heuresSemaine, 0)}</p></div>
            <BookOpen className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, matricule ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedSpecialite}
            onChange={(e) => setSelectedSpecialite(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Toutes spécialités</option>
            {specialites.filter(s => s !== "all").map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Tous statuts</option>
            <option value="actif">Actif</option><option value="inactif">Inactif</option><option value="conge">Congé</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom & Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spécialité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heures</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEnseignants.map((enseignant) => (
                <tr key={enseignant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{enseignant.matricule}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div>
                      <div><p className="font-medium">{enseignant.prenom} {enseignant.nom}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1"><Award className="w-4 h-4 text-gray-900" />{enseignant.specialite}</div></td>
                  <td className="px-6 py-4"><div><p className="text-sm">{enseignant.telephone}</p><p className="text-xs text-gray-500">{enseignant.email}</p></div></td>
                  <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{enseignant.classes.slice(0,2).map(c => <span key={c} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{c}</span>)}</div></td>
                  <td className="px-6 py-4">{enseignant.heuresSemaine}h/semaine</td>
                  <td className="px-6 py-4">{getStatutBadge(enseignant.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedEnseignant(enseignant); setShowDetailModal(true); }} className="text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleViewAssignations(enseignant)} className="text-purple-600"><BookOpen className="w-4 h-4" title="Assignations" /></button>
                      <button onClick={() => { setEditingEnseignant(enseignant); setShowForm(true); }} className="text-green-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(enseignant.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">{filteredEnseignants.length} enseignants</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border rounded-lg">◀</button>
            <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg">▶</button>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedEnseignant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Fiche enseignant</h2><button onClick={() => setShowDetailModal(false)} className="text-gray-900">✕</button></div></div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4"><div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-10 h-10 text-blue-600" /></div><div><h3 className="text-2xl font-bold">{selectedEnseignant.prenom} {selectedEnseignant.nom}</h3><p className="text-gray-500">Matricule: {selectedEnseignant.matricule}</p>{getStatutBadge(selectedEnseignant.statut)}</div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Informations professionnelles</h4><div className="grid md:grid-cols-2 gap-4"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-900" />{selectedEnseignant.specialite}</div><div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-900" />{selectedEnseignant.diplome}</div><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-900" />Embauche: {selectedEnseignant.dateEmbauche}</div><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-900" />{selectedEnseignant.heuresSemaine}h/semaine</div></div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Contact</h4><div className="grid md:grid-cols-2 gap-4"><div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-900" />{selectedEnseignant.telephone}</div><div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-900" />{selectedEnseignant.email}</div><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-900" />{selectedEnseignant.adresse}</div></div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Classes assignées</h4><div className="flex flex-wrap gap-2">{selectedEnseignant.classes.map(c => <span key={c} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{c}</span>)}</div></div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end"><button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button></div>
          </div>
        </div>
      )}

      {/* Modal Assignations */}
      {showAssignModal && selectedEnseignant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Assignations - {selectedEnseignant.prenom} {selectedEnseignant.nom}</h2><button onClick={() => setShowAssignModal(false)} className="text-gray-900">✕</button></div></div>
            <div className="p-6"><div className="space-y-3">{assignations.map((a, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><p className="font-medium">{a.matiereNom}</p><p className="text-sm text-gray-500">{a.classeNom}</p></div><div className="flex items-center gap-4"><span className="text-sm text-gray-500">{a.heures}h/semaine</span></div></div>))}</div></div>
            <div className="p-6 border-t flex justify-end"><button onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button></div>
          </div>
        </div>
      )}

      {/* Modal Formulaire simplifié */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b"><h2 className="text-xl font-bold">{editingEnseignant ? "Modifier" : "Ajouter"} un enseignant</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Nom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Prénom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <div><label className="block text-sm mb-1">Email *</label><input type="email" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Téléphone *</label><input type="tel" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Spécialité *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Diplôme *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Date embauche</label><input type="date" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Statut</label><select className="w-full px-3 py-2 border rounded-lg"><option>actif</option><option>inactif</option><option>conge</option></select></div></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3"><button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button><button onClick={() => setShowForm(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingEnseignant ? "Mettre à jour" : "Ajouter"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}