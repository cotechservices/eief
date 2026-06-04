// app/dashboard/admin/personnel/page.tsx
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
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  Printer
} from "lucide-react";

interface Personnel {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  poste: string;
  departement: string;
  dateEmbauche: string;
  statut: "actif" | "inactif" | "conge";
  salaire: number;
  type: "admin" | "technique" | "service" | "direction";
}

export default function GestionPersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartement, setSelectedDepartement] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    setTimeout(() => {
      const mockPersonnel: Personnel[] = [
        { id: 1, matricule: "PER-2025-001", nom: "Barry", prenom: "Fatoumata", email: "f.barry@eief.edu.gn", telephone: "+224 622 123 456", adresse: "Conakry", poste: "Secrétaire Générale", departement: "Administration", dateEmbauche: "2018-09-01", statut: "actif", salaire: 350000, type: "admin" },
        { id: 2, matricule: "PER-2025-002", nom: "Camara", prenom: "Mohamed", email: "m.camara@eief.edu.gn", telephone: "+224 622 234 567", adresse: "Conakry", poste: "Comptable", departement: "Finances", dateEmbauche: "2019-09-01", statut: "actif", salaire: 400000, type: "admin" },
        { id: 3, matricule: "PER-2025-003", nom: "Diallo", prenom: "Aissatou", email: "a.diallo@eief.edu.gn", telephone: "+224 622 345 678", adresse: "Kindia", poste: "Infirmière", departement: "Santé", dateEmbauche: "2020-09-01", statut: "actif", salaire: 300000, type: "service" },
        { id: 4, matricule: "PER-2025-004", nom: "Konaté", prenom: "Mamadou", email: "m.konate@eief.edu.gn", telephone: "+224 622 456 789", adresse: "Mamou", poste: "Chauffeur", departement: "Transport", dateEmbauche: "2017-09-01", statut: "actif", salaire: 250000, type: "technique" },
        { id: 5, matricule: "PER-2025-005", nom: "Souaré", prenom: "Aminata", email: "a.souare@eief.edu.gn", telephone: "+224 622 567 890", adresse: "Labé", poste: "Agent de cantine", departement: "Restauration", dateEmbauche: "2021-09-01", statut: "actif", salaire: 200000, type: "service" },
        { id: 6, matricule: "PER-2025-006", nom: "Touré", prenom: "Ousmane", email: "o.toure@eief.edu.gn", telephone: "+224 622 678 901", adresse: "Conakry", poste: "Bibliothécaire", departement: "Bibliothèque", dateEmbauche: "2019-09-01", statut: "conge", salaire: 280000, type: "service" },
        { id: 7, matricule: "PER-2025-007", nom: "Keita", prenom: "Mariam", email: "m.keita@eief.edu.gn", telephone: "+224 622 789 012", adresse: "Faranah", poste: "Agent d'entretien", departement: "Maintenance", dateEmbauche: "2022-09-01", statut: "actif", salaire: 180000, type: "technique" },
        { id: 8, matricule: "PER-2025-008", nom: "Sylla", prenom: "Ibrahim", email: "i.sylla@eief.edu.gn", telephone: "+224 622 890 123", adresse: "Conakry", poste: "Surveillant", departement: "Discipline", dateEmbauche: "2018-09-01", statut: "actif", salaire: 320000, type: "admin" },
      ];
      setPersonnel(mockPersonnel);
      setLoading(false);
    }, 1000);
  }, []);

  const departements = ["all", ...new Set(personnel.map(p => p.departement))];

  const filteredPersonnel = personnel.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.poste.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartement === "all" || p.departement === selectedDepartement;
    const matchesStatut = selectedStatut === "all" || p.statut === selectedStatut;
    return matchesSearch && matchesDept && matchesStatut;
  });

  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);
  const paginatedPersonnel = filteredPersonnel.slice(
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
    if (confirm("Voulez-vous vraiment supprimer cet agent ?")) {
      setPersonnel(personnel.filter(p => p.id !== id));
    }
  };

  const handleExport = () => {
    const headers = ["Matricule", "Nom", "Prénom", "Poste", "Département", "Email", "Téléphone", "Date embauche", "Statut", "Salaire"];
    const csvData = filteredPersonnel.map(p => [p.matricule, p.nom, p.prenom, p.poste, p.departement, p.email, p.telephone, p.dateEmbauche, p.statut, p.salaire]);
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "personnel_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: personnel.length,
    actifs: personnel.filter(p => p.statut === "actif").length,
    salairesMois: personnel.reduce((acc, p) => acc + p.salaire, 0),
    departements: new Set(personnel.map(p => p.departement)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du personnel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion du personnel</h1>
          <p className="text-gray-500">Personnel administratif, technique et de service</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={() => { setEditingPersonnel(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvel agent
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-500 text-sm">Total agents</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-500 text-sm">Agents actifs</p><p className="text-2xl font-bold text-green-600">{stats.actifs}</p></div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-500 text-sm">Masse salariale</p><p className="text-2xl font-bold text-orange-600">{stats.salairesMois.toLocaleString()} GNF</p></div>
            <CreditCard className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-500 text-sm">Départements</p><p className="text-2xl font-bold text-purple-600">{stats.departements}</p></div>
            <Briefcase className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input type="text" placeholder="Rechercher par nom, prénom, matricule ou poste..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <select value={selectedDepartement} onChange={(e) => setSelectedDepartement(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Tous départements</option>
            {departements.filter(d => d !== "all").map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className="px-3 py-2 border rounded-lg">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPersonnel.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{agent.matricule}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div><div><p className="font-medium">{agent.prenom} {agent.nom}</p></div></div></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-gray-900" /><span>{agent.poste}</span></div></td>
                  <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{agent.departement}</span></td>
                  <td className="px-6 py-4"><div><p className="text-sm">{agent.telephone}</p><p className="text-xs text-gray-500">{agent.email}</p></div></td>
                  <td className="px-6 py-4">{getStatutBadge(agent.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedPersonnel(agent); setShowDetailModal(true); }} className="text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingPersonnel(agent); setShowForm(true); }} className="text-green-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(agent.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">{filteredPersonnel.length} agents</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Fiche agent</h2><button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-600">✕</button></div></div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4"><div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-10 h-10 text-blue-600" /></div><div><h3 className="text-2xl font-bold">{selectedPersonnel.prenom} {selectedPersonnel.nom}</h3><p className="text-gray-500">Matricule: {selectedPersonnel.matricule}</p>{getStatutBadge(selectedPersonnel.statut)}</div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Informations professionnelles</h4><div className="grid md:grid-cols-2 gap-4"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-900" />{selectedPersonnel.poste}</div><div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-900" />{selectedPersonnel.departement}</div><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-900" />Embauche: {selectedPersonnel.dateEmbauche}</div><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-900" />Salaire: {selectedPersonnel.salaire.toLocaleString()} GNF</div></div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Contact</h4><div className="grid md:grid-cols-2 gap-4"><div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-900" />{selectedPersonnel.telephone}</div><div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-900" />{selectedPersonnel.email}</div><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-900" />{selectedPersonnel.adresse}</div></div></div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Printer className="w-4 h-4" />Imprimer</button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire simplifié */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b"><h2 className="text-xl font-bold">{editingPersonnel ? "Modifier" : "Ajouter"} un agent</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Nom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Prénom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Email *</label><input type="email" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Téléphone *</label><input type="tel" className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Poste *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Département</label><select className="w-full px-3 py-2 border rounded-lg"><option>Administration</option><option>Finances</option><option>Transport</option><option>Restauration</option><option>Maintenance</option><option>Santé</option><option>Bibliothèque</option><option>Discipline</option></select></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Date embauche</label><input type="date" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Salaire</label><input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="GNF" /></div></div>
              <div><label className="block text-sm mb-1">Statut</label><select className="w-full px-3 py-2 border rounded-lg"><option>actif</option><option>inactif</option><option>conge</option></select></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3"><button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button><button onClick={() => setShowForm(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingPersonnel ? "Mettre à jour" : "Ajouter"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}