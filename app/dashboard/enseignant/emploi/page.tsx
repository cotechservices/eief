// app/dashboard/enseignant/emploi/page.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EnseignantEmploiPage() {
  const [semaine, setSemaine] = useState(0);
  const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  const emploi = {
    Lundi: [
      { heure: "08:00-09:30", classe: "5ème A", matiere: "Mathématiques", salle: "Salle 12" },
      { heure: "09:45-11:15", classe: "4ème A", matiere: "Mathématiques", salle: "Salle 12" }
    ],
    Mardi: [
      { heure: "08:00-09:30", classe: "6ème B", matiere: "Mathématiques", salle: "Salle 8" }
    ],
    Mercredi: [
      { heure: "10:00-11:30", classe: "5ème A", matiere: "Mathématiques", salle: "Salle 12" }
    ],
    Jeudi: [
      { heure: "08:00-09:30", classe: "4ème A", matiere: "Mathématiques", salle: "Salle 12" },
      { heure: "13:30-15:00", classe: "6ème B", matiere: "Mathématiques", salle: "Salle 8" }
    ],
    Vendredi: [
      { heure: "09:45-11:15", classe: "5ème A", matiere: "Mathématiques", salle: "Salle 12" }
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon emploi du temps</h1>
        <p className="text-gray-500">Mathématiques - Année 2025-2026</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Semaine du 19 au 23 mai 2025</h3>
          <div className="flex gap-2">
            <button className="p-1 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-1 rounded-lg hover:bg-gray-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Horaire</th>
                {jours.map((j) => (
                  <th key={j} className="px-4 py-3 text-left text-sm font-medium">
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* 08:00 - 09:30 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium bg-gray-50">08:00-09:30</td>
                <td className="px-4 py-3">
                  {emploi.Lundi[0] && (
                    <div>
                      <p className="font-medium">{emploi.Lundi[0].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Lundi[0].salle}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {emploi.Mardi[0] && (
                    <div>
                      <p className="font-medium">{emploi.Mardi[0].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Mardi[0].salle}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">
                  {emploi.Jeudi[0] && (
                    <div>
                      <p className="font-medium">{emploi.Jeudi[0].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Jeudi[0].salle}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3"></td>
              </tr>

              {/* 09:45 - 11:15 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium bg-gray-50">09:45-11:15</td>
                <td className="px-4 py-3">
                  {emploi.Lundi[1] && (
                    <div>
                      <p className="font-medium">{emploi.Lundi[1].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Lundi[1].salle}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">
                  {emploi.Vendredi[0] && (
                    <div>
                      <p className="font-medium">{emploi.Vendredi[0].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Vendredi[0].salle}</p>
                    </div>
                  )}
                </td>
              </tr>

              {/* 10:00 - 11:30 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium bg-gray-50">10:00-11:30</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">
                  {emploi.Mercredi[0] && (
                    <div>
                      <p className="font-medium">{emploi.Mercredi[0].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Mercredi[0].salle}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
              </tr>

              {/* 13:30 - 15:00 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium bg-gray-50">13:30-15:00</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3">
                  {emploi.Jeudi[1] && (
                    <div>
                      <p className="font-medium">{emploi.Jeudi[1].classe}</p>
                      <p className="text-xs text-gray-500">{emploi.Jeudi[1].salle}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}