// app/dashboard/parent/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  Bus, 
  BookOpen, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  MessageSquare  
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
}

export default function ParentDashboard() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState<Enfant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation chargement des enfants
    setTimeout(() => {
      const enfantsData = [
        { id: 1, nom: "Diallo", prenom: "Ibrahim", classe: "5ème A", moyenne: 14.5, rang: 6, absences: 2, retards: 0 },
        { id: 2, nom: "Diallo", prenom: "Aïssatou", classe: "3ème A", moyenne: 16, rang: 3, absences: 0, retards: 1 },
        { id: 3, nom: "Diallo", prenom: "Mamadou", classe: "6ème A", moyenne: 12, rang: 15, absences: 4, retards: 2 },
      ];
      setEnfants(enfantsData);
      setSelectedEnfant(enfantsData[0]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Espace Parent</h1>
        <p className="text-gray-500">Suivez la scolarité de vos enfants</p>
      </div>

      {/* Sélection de l'enfant */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {enfants.map((enfant) => (
            <button
              key={enfant.id}
              onClick={() => setSelectedEnfant(enfant)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedEnfant?.id === enfant.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {enfant.prenom} {enfant.nom} - {enfant.classe}
            </button>
          ))}
        </div>
      </div>

      {selectedEnfant && (
        <>
          {/* Cartes stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Moyenne générale</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedEnfant.moyenne}/20</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Rang: {selectedEnfant.rang}e / 25</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Absences</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedEnfant.absences}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Retards: {selectedEnfant.retards}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Devoirs à rendre</p>
                  <p className="text-2xl font-bold text-red-600">3</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">1 en retard</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Frais scolaires</p>
                  <p className="text-2xl font-bold text-green-600">✓ À jour</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Prochain: 15 Mai</p>
            </div>
          </div>

          {/* Tableau des notes */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Dernières notes</h3>
              <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                <Download className="w-4 h-4" />
                Télécharger bulletin
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matière</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moyenne classe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appréciation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">Mathématiques</td>
                    <td className="px-6 py-4 font-medium text-green-600">15/20</td>
                    <td className="px-6 py-4">12/20</td>
                    <td className="px-6 py-4">Très bien</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Français</td>
                    <td className="px-6 py-4 font-medium text-green-600">14/20</td>
                    <td className="px-6 py-4">11/20</td>
                    <td className="px-6 py-4">Bien</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Anglais</td>
                    <td className="px-6 py-4 font-medium text-orange-600">10/20</td>
                    <td className="px-6 py-4">12/20</td>
                    <td className="px-6 py-4">Passable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/parent/messages"
              className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
                <MessageSquare className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">Messagerie</p>
            </Link>
            <Link
              href="/dashboard/parent/transport"
              className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
                <Bus className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">Transport</p>
            </Link>
            <Link
              href="/dashboard/parent/finances"
              className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
                <CreditCard className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">Finances</p>
            </Link>
            <Link
              href="/dashboard/parent/emploi-temps"
              className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-yellow-600 transition">
                <Calendar className="w-6 h-6 text-yellow-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">Emploi du temps</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}