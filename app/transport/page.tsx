// app/transport/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Bus, MapPin, Users, Clock, Phone, AlertCircle, Info, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TransportLine {
  id: number;
  immatriculation: string;
  chauffeur: string;
  chauffeur_tel: string;
  capacite: number;
  trajet: string;
  horaireMatin: string;
  horaireSoir: string;
}

export default function PublicTransportPage() {
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        const response = await fetch('/api/public/transport');
        if (response.ok) {
          const data = await response.json();
          setLines(data || []);
        }
      } catch (error) {
        console.error("Erreur chargement transport:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/bus.png"
            alt="Transport Scolaire EIEF"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <span className="bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full mb-3 inline-block">
                Sécurité & Ponctualité
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Transport Scolaire</h1>
              <p className="text-xl text-blue-50 mb-6">
                Un service de transport fiable et sécurisé reliant les différents quartiers de Conakry à notre école.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Info Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Sécurité Maximale</h3>
              <p className="text-sm text-gray-900">Bus modernes régulièrement révisés et chauffeurs expérimentés formés aux normes de conduite de sécurité.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Ponctualité Rigoureuse</h3>
              <p className="text-sm text-gray-900">Des horaires de ramassage fixes le matin pour garantir l'arrivée avant le début des cours.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Accompagnement</h3>
              <p className="text-sm text-gray-900">Présence d'un surveillant ou assistant à bord de chaque bus pour encadrer les élèves.</p>
            </div>
          </div>
        </div>

        {/* Routes Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-blue-600 w-6 h-6" /> Lignes et Trajets Actifs
            </h2>
            <p className="text-gray-900 text-sm mt-1">Consultez les lignes de ramassage scolaire, les horaires et les contacts associés</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : lines.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed">
              <Bus className="w-12 h-12 text-gray-900 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Aucun trajet configuré pour le moment.</p>
              <p className="text-gray-900 text-sm mt-1">L'administration mettra à jour la liste des trajets et bus très prochainement.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lines.map((line) => (
                <div key={line.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition bg-gradient-to-br from-white to-gray-50/20 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full uppercase">
                        {line.immatriculation || "Bus"}
                      </span>
                      <span className="text-xs text-gray-900 font-semibold">{line.capacite} places</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      {line.trajet}
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                        <p className="text-[10px] text-gray-900 font-bold uppercase tracking-wider">Horaires de passage</p>
                        <div className="flex justify-between items-center text-xs text-gray-900">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-900" /> Matin (Aller)</span>
                          <span className="font-bold text-blue-900">{line.horaireMatin}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-900">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-900" /> Soir (Retour)</span>
                          <span className="font-bold text-blue-900">{line.horaireSoir}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-900 font-bold uppercase tracking-wider">Responsable / Chauffeur</p>
                        <p className="text-sm font-semibold text-gray-900">{line.chauffeur}</p>
                        {line.chauffeur_tel && line.chauffeur_tel !== "-" && (
                          <a href={`tel:${line.chauffeur_tel}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {line.chauffeur_tel}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-900">
                    <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-amber-500" /> Inscription requise</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-12 border border-blue-100 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment souscrire ?</h2>
            <div className="space-y-4 text-gray-900">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                <p className="text-sm">Consultez la liste des lignes et vérifiez si votre quartier est desservi.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                <p className="text-sm">Remplissez le formulaire de demande d'inscription au secrétariat de l'école.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                <p className="text-sm">Réglez les frais mensuels de transport auprès de la comptabilité pour valider la carte d'accès au bus.</p>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <Link href="/contact" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition text-sm">
                Contacter le secrétariat
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="bg-blue-900 text-white p-6 rounded-2xl border border-blue-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Informations Importantes</span>
            </div>
            <ul className="text-xs text-blue-100 space-y-2 list-disc list-inside">
              <li>Les élèves doivent se présenter à leur arrêt de bus 5 minutes avant l'heure prévue.</li>
              <li>Chaque élève inscrit doit présenter sa carte de transport valide au chauffeur à chaque montée.</li>
              <li>Toute absence ou changement exceptionnel de trajet doit être signalé au chauffeur ou au surveillant de ligne le plus tôt possible.</li>
              <li>Les abonnements sont mensuels et payables d'avance entre le 1er et le 5 de chaque mois.</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
