// app/dashboard/admin/finances/rapports/page.tsx
"use client";

import { useState } from "react";
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Printer,
  ChevronRight,
  Eye
} from "lucide-react";

export default function RapportsFinanciersPage() {
  const [periode, setPeriode] = useState("annee");
  const [typeRapport, setTypeRapport] = useState("global");

  const rapports = [
    {
      id: 1,
      titre: "Rapport financier annuel 2025",
      description: "Bilan complet des recettes et dépenses de l'année",
      date: "Janvier - Décembre 2025",
      type: "global",
      recettes: 145000000,
      depenses: 82000000,
      benefice: 63000000,
    },
    {
      id: 2,
      titre: "Rapport des recettes par trimestre",
      description: "Analyse des recettes par période",
      date: "2025",
      type: "recettes",
      inscriptions: 37500000,
      mensualites: 78000000,
      cantine: 12500000,
      transport: 10000000,
      autres: 7000000,
    },
    {
      id: 3,
      titre: "Rapport des dépenses par catégorie",
      description: "Répartition des dépenses 2025",
      date: "2025",
      type: "depenses",
      salaires: 42000000,
      fournitures: 15000000,
      maintenance: 10000000,
      utilities: 8000000,
      autres: 7000000,
    },
    {
      id: 4,
      titre: "Situation des impayés",
      description: "Liste des familles avec paiements en retard",
      date: "Mai 2025",
      type: "impayes",
      totalImpayes: 4500000,
      nbFamilles: 12,
    },
  ];

  const categories = [
    { name: "Rapports globaux", count: 4, icon: BarChart3, color: "bg-blue-100 text-blue-600" },
    { name: "Recettes", count: 3, icon: TrendingUp, color: "bg-green-100 text-green-600" },
    { name: "Dépenses", count: 3, icon: TrendingDown, color: "bg-red-100 text-red-600" },
    { name: "Trésorerie", count: 2, icon: PieChart, color: "bg-purple-100 text-purple-600" },
  ];

  const rapides = [
    { nom: "Bilan mensuel", description: "Récap des entrées/sorties du mois", href: "#" },
    { nom: "État des créances", description: "Tous les paiements en attente", href: "#" },
    { nom: "Prévisionnel", description: "Prévisions sur 3 mois", href: "#" },
    { nom: "Taux de recouvrement", description: "Taux par classe", href: "#" },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports financiers</h1>
          <p className="text-gray-500">Analyse et suivi des finances</p>
        </div>
        <div className="flex gap-3">
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="annee">Cette année</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter tout
          </button>
        </div>
      </div>

      {/* Cartes des catégories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer">
            <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-3`}>
              <cat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-800">{cat.name}</h3>
            <p className="text-2xl font-bold mt-1">{cat.count}</p>
            <p className="text-xs text-gray-500">rapports disponibles</p>
          </div>
        ))}
      </div>

      {/* Rapports récents */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">Rapports récents</h3>
        </div>
        <div className="divide-y">
          {rapports.map((rapport) => (
            <div key={rapport.id} className="px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{rapport.titre}</h4>
                  <p className="text-sm text-gray-500 mt-1">{rapport.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {rapport.date}
                    </span>
                    {rapport.recettes && (
                      <span className="text-xs text-green-600">Recettes: {rapport.recettes.toLocaleString()} GNF</span>
                    )}
                    {rapport.depenses && (
                      <span className="text-xs text-red-600">Dépenses: {rapport.depenses.toLocaleString()} GNF</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:text-blue-600 transition">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 transition">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 transition">
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rapports rapides */}
      <div className="grid md:grid-cols-4 gap-4">
        {rapides.map((rapide, idx) => (
          <a
            key={idx}
            href={rapide.href}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-800">{rapide.nom}</h4>
                <p className="text-xs text-gray-500 mt-1">{rapide.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
            </div>
          </a>
        ))}
      </div>

      {/* Graphiques récapitulatifs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Évolution des finances */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Évolution mensuelle 2025</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Janvier</span>
                <span className="text-green-600">2.5M GNF</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[65%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Février</span>
                <span className="text-green-600">2.8M GNF</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[72%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mars</span>
                <span className="text-green-600">3.1M GNF</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[80%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avril</span>
                <span className="text-green-600">2.9M GNF</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[75%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mai</span>
                <span className="text-blue-600">3.2M GNF</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-[82%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition des dépenses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Répartition des dépenses 2025</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>Salaires</span>
                  <span>51% (42M GNF)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>Fournitures</span>
                  <span>18% (15M GNF)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>Maintenance</span>
                  <span>12% (10M GNF)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>Eau/Électricité</span>
                  <span>10% (8M GNF)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>Autres</span>
                  <span>9% (7M GNF)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-blue-800">Export de rapports personnalisés</h3>
            <p className="text-sm text-blue-600 mt-1">Créez un rapport sur mesure</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Créer un rapport
          </button>
        </div>
      </div>
    </div>
  );
}