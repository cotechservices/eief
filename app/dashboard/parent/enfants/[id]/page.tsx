// app/dashboard/parent/enfants/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  XCircle
} from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  moyenne: number;
  rang: number;
  absences: number;
  retards: number;
  frais: { total: number; paye: number; reste: number };
  emploiDuTemps: { jour: string; matieres: { heure: string; matiere: string; salle: string }[] }[];
  notes: { matiere: string; note: number; moyenneClasse: number; appreciation: string }[];
  devoirs: { matiere: string; titre: string; dateLimite: string; soumis: boolean; urgent: boolean }[];
  presences: { date: string; statut: string; justifie: boolean }[];
}

export default function EnfantDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const [activeTab, setActiveTab] = useState("notes");

  // Données statiques par enfant
  const enfantsData: Record<number, Enfant> = {
    1: {
      id: 1, nom: "Diallo", prenom: "Ibrahim", classe: "5ème A", moyenne: 14.5, rang: 6,
      absences: 2, retards: 0,
      frais: { total: 1200000, paye: 800000, reste: 400000 },
      emploiDuTemps: [
        { jour: "Lundi", matieres: [{ heure: "08:00-09:30", matiere: "Mathématiques", salle: "Salle 12" }, { heure: "09:45-11:15", matiere: "Français", salle: "Salle 12" }] },
        { jour: "Mardi", matieres: [{ heure: "08:00-09:30", matiere: "Anglais", salle: "Labo 3" }] },
        { jour: "Mercredi", matieres: [{ heure: "10:00-11:30", matiere: "Histoire", salle: "Salle 8" }] },
        { jour: "Jeudi", matieres: [{ heure: "08:00-09:30", matiere: "Mathématiques", salle: "Salle 12" }] },
        { jour: "Vendredi", matieres: [{ heure: "09:45-11:15", matiere: "Français", salle: "Salle 12" }] },
      ],
      notes: [
        { matiere: "Mathématiques", note: 15, moyenneClasse: 12, appreciation: "Très bien" },
        { matiere: "Français", note: 14, moyenneClasse: 11, appreciation: "Bien" },
        { matiere: "Anglais", note: 12, moyenneClasse: 10, appreciation: "Bien" },
        { matiere: "Histoire", note: 13, moyenneClasse: 11, appreciation: "Bien" },
      ],
      devoirs: [
        { matiere: "Mathématiques", titre: "Exercices p45", dateLimite: "2025-05-15", soumis: false, urgent: true },
        { matiere: "Français", titre: "Rédaction", dateLimite: "2025-05-18", soumis: false, urgent: false },
      ],
      presences: [
        { date: "2025-05-19", statut: "present", justifie: false },
        { date: "2025-05-20", statut: "present", justifie: false },
        { date: "2025-05-21", statut: "absent", justifie: true },
        { date: "2025-05-22", statut: "present", justifie: false },
        { date: "2025-05-23", statut: "retard", justifie: false },
      ],
    },
    2: {
      id: 2, nom: "Diallo", prenom: "Aïssatou", classe: "3ème A", moyenne: 16, rang: 3,
      absences: 0, retards: 1,
      frais: { total: 1200000, paye: 1200000, reste: 0 },
      emploiDuTemps: [
        { jour: "Lundi", matieres: [{ heure: "08:00-09:30", matiere: "Français", salle: "Salle 12" }, { heure: "09:45-11:15", matiere: "Mathématiques", salle: "Salle 12" }] },
        { jour: "Mardi", matieres: [{ heure: "10:00-11:30", matiere: "Anglais", salle: "Labo 3" }] },
        { jour: "Mercredi", matieres: [{ heure: "08:00-09:30", matiere: "Histoire", salle: "Salle 8" }] },
        { jour: "Jeudi", matieres: [{ heure: "13:30-15:00", matiere: "Sciences", salle: "Labo Sciences" }] },
        { jour: "Vendredi", matieres: [{ heure: "08:00-09:30", matiere: "Mathématiques", salle: "Salle 12" }] },
      ],
      notes: [
        { matiere: "Mathématiques", note: 16, moyenneClasse: 12, appreciation: "Excellent" },
        { matiere: "Français", note: 17, moyenneClasse: 11, appreciation: "Excellent" },
        { matiere: "Anglais", note: 15, moyenneClasse: 10, appreciation: "Très bien" },
        { matiere: "Sciences", note: 16, moyenneClasse: 12, appreciation: "Excellent" },
      ],
      devoirs: [{ matiere: "Mathématiques", titre: "Problèmes", dateLimite: "2025-05-16", soumis: true, urgent: false }],
      presences: [
        { date: "2025-05-19", statut: "present", justifie: false },
        { date: "2025-05-20", statut: "present", justifie: false },
        { date: "2025-05-21", statut: "present", justifie: false },
        { date: "2025-05-22", statut: "present", justifie: false },
        { date: "2025-05-23", statut: "retard", justifie: false },
      ],
    },
    3: {
      id: 3, nom: "Diallo", prenom: "Mamadou", classe: "6ème A", moyenne: 12, rang: 15,
      absences: 4, retards: 2,
      frais: { total: 1200000, paye: 600000, reste: 600000 },
      emploiDuTemps: [
        { jour: "Lundi", matieres: [{ heure: "13:30-15:00", matiere: "Histoire", salle: "Salle 8" }] },
        { jour: "Mardi", matieres: [{ heure: "08:00-09:30", matiere: "Mathématiques", salle: "Salle 12" }] },
        { jour: "Mercredi", matieres: [{ heure: "10:00-11:30", matiere: "Français", salle: "Salle 12" }] },
        { jour: "Jeudi", matieres: [{ heure: "08:00-09:30", matiere: "Anglais", salle: "Labo 3" }] },
        { jour: "Vendredi", matieres: [{ heure: "09:45-11:15", matiere: "Sciences", salle: "Labo Sciences" }] },
      ],
      notes: [
        { matiere: "Mathématiques", note: 11, moyenneClasse: 12, appreciation: "Passable" },
        { matiere: "Français", note: 10, moyenneClasse: 11, appreciation: "Passable" },
        { matiere: "Anglais", note: 9, moyenneClasse: 10, appreciation: "Insuffisant" },
        { matiere: "Histoire", note: 12, moyenneClasse: 11, appreciation: "Bien" },
      ],
      devoirs: [
        { matiere: "Histoire", titre: "Dissertation", dateLimite: "2025-05-10", soumis: false, urgent: true },
        { matiere: "Anglais", titre: "Exercices", dateLimite: "2025-05-14", soumis: false, urgent: true },
        { matiere: "Mathématiques", titre: "Calculs", dateLimite: "2025-05-20", soumis: false, urgent: false },
      ],
      presences: [
        { date: "2025-05-19", statut: "absent", justifie: false },
        { date: "2025-05-20", statut: "absent", justifie: true },
        { date: "2025-05-21", statut: "present", justifie: false },
        { date: "2025-05-22", statut: "retard", justifie: false },
        { date: "2025-05-23", statut: "absent", justifie: false },
      ],
    },
  };

  const enfant = enfantsData[id];

  if (!enfant) {
    return <div className="text-center py-10">Enfant non trouvé</div>;
  }

  const tabs = [
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "devoirs", label: "Devoirs", icon: AlertCircle },
    { id: "emploi", label: "Emploi du temps", icon: Calendar },
    { id: "presences", label: "Présences", icon: Users },
    { id: "finances", label: "Finances", icon: CreditCard },
  ];

  const getStatutBadge = (statut: string, justifie: boolean) => {
    switch(statut) {
      case "present":
        return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Présent</span>;
      case "absent":
        return <span className={`text-sm flex items-center gap-1 ${justifie ? "text-orange-600" : "text-red-600"}`}>
          <XCircle className="w-4 h-4" /> Absent {justifie && "(justifié)"}
        </span>;
      case "retard":
        return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> Retard</span>;
      default:
        return <span>{statut}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/parent" className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{enfant.prenom} {enfant.nom}</h1>
          <p className="text-gray-500">{enfant.classe} - Année scolaire 2025-2026</p>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Moyenne générale</p>
          <p className="text-3xl font-bold">{enfant.moyenne}/20</p>
          <p className="text-xs mt-1">Rang: {enfant.rang}e / 25</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-gray-500 text-sm">Absences</p>
          <p className="text-2xl font-bold text-orange-600">{enfant.absences}</p>
          <p className="text-sm text-gray-500">Retards: {enfant.retards}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-gray-500 text-sm">Devoirs à rendre</p>
          <p className="text-2xl font-bold text-red-600">{enfant.devoirs.filter(d => !d.soumis).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-gray-500 text-sm">Frais scolaires</p>
          <p className="text-lg font-bold text-green-600">{((enfant.frais.paye / enfant.frais.total) * 100).toFixed(0)}%</p>
          <p className="text-xs text-red-500">Reste: {enfant.frais.reste.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b">
          <div className="flex gap-2 md:gap-6 px-4 md:px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Onglet Notes */}
        {activeTab === "notes" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Bulletin de notes</h3>
              <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                <Download className="w-4 h-4" /> Télécharger PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-2 text-left text-sm font-medium">Matière</th><th className="px-4 py-2 text-left text-sm font-medium">Note</th><th className="px-4 py-2 text-left text-sm font-medium">Moyenne classe</th><th className="px-4 py-2 text-left text-sm font-medium">Appréciation</th></tr>
                </thead>
                <tbody className="divide-y">
                  {enfant.notes.map((note, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{note.matiere}</td>
                      <td className="px-4 py-2 font-medium text-green-600">{note.note}/20</td>
                      <td className="px-4 py-2">{note.moyenneClasse}/20</td>
                      <td className="px-4 py-2">{note.appreciation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet Devoirs */}
        {activeTab === "devoirs" && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Liste des devoirs</h3>
            <div className="space-y-3">
              {enfant.devoirs.map((devoir, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{devoir.matiere}</p>
                      <p className="text-sm text-gray-600">{devoir.titre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-600">À rendre le {devoir.dateLimite}</p>
                      {devoir.urgent && <span className="text-xs text-red-500">⚠️ Urgent</span>}
                    </div>
                  </div>
                  <div className="mt-2">
                    {devoir.soumis ? (
                      <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Soumis</span>
                    ) : (
                      <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Non soumis</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Emploi du temps */}
        {activeTab === "emploi" && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Emploi du temps hebdomadaire</h3>
            <div className="space-y-4">
              {enfant.emploiDuTemps.map((jour, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-medium">{jour.jour}</div>
                  <div className="divide-y">
                    {jour.matieres.map((cours, i) => (
                      <div key={i} className="px-4 py-2 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{cours.matiere}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {cours.salle}</p>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {cours.heure}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Présences */}
        {activeTab === "presences" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Relevé des présences</h3>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Présent</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Absent</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Retard</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-2 text-left text-sm font-medium">Date</th><th className="px-4 py-2 text-left text-sm font-medium">Statut</th><th className="px-4 py-2 text-left text-sm font-medium">Justification</th></tr>
                </thead>
                <tbody className="divide-y">
                  {enfant.presences.map((presence, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{new Date(presence.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{getStatutBadge(presence.statut, presence.justifie)}</td>
                      <td className="px-4 py-2">{presence.justifie ? "Oui" : "Non"}</td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet Finances */}
        {activeTab === "finances" && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Situation financière</h3>
            
            {/* Récapitulatif */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Total à payer</p>
                <p className="text-2xl font-bold text-blue-600">{enfant.frais.total.toLocaleString()} GNF</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Déjà payé</p>
                <p className="text-2xl font-bold text-green-600">{enfant.frais.paye.toLocaleString()} GNF</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Reste à payer</p>
                <p className="text-2xl font-bold text-red-600">{enfant.frais.reste.toLocaleString()} GNF</p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression des paiements</span>
                <span>{((enfant.frais.paye / enfant.frais.total) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(enfant.frais.paye / enfant.frais.total) * 100}%` }}></div>
              </div>
            </div>

            {/* Bouton de paiement */}
            <div className="text-center">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                Effectuer un paiement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}