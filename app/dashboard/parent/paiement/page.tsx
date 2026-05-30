// app/dashboard/parent/paiement/page.tsx
"use client";

import { useState, useEffect } from "react";
import { CreditCard, Smartphone, Wallet, CheckCircle } from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  frais: { total: number; paye: number; reste: number };
  preinscriptionId: number;
}

export default function ParentPaiementPage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState<Enfant | null>(null);
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger les enfants avec paiements en attente
    const fetchEnfants = async () => {
      const response = await fetch("/api/parent/enfants/preinscriptions");
      const data = await response.json();
      setEnfants(data);
    };
    fetchEnfants();
  }, []);

  const handlePaiement = async () => {
    if (!selectedEnfant || !modePaiement) return;

    setLoading(true);
    try {
      const response = await fetch("/api/parent/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preinscriptionId: selectedEnfant.preinscriptionId,
          montant: selectedEnfant.frais.reste,
          modePaiement,
          reference,
        }),
      });

      if (response.ok) {
        alert("Paiement effectué avec succès !");
        window.location.reload();
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paiement des frais de scolarité</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Choisissez l'enfant</h2>
        <div className="space-y-3">
          {enfants.map((enfant) => (
            <button
              key={enfant.id}
              onClick={() => setSelectedEnfant(enfant)}
              className={`w-full p-4 border rounded-lg text-left transition ${
                selectedEnfant?.id === enfant.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{enfant.prenom} {enfant.nom}</p>
                  <p className="text-sm text-gray-500">{enfant.classe}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600">{enfant.frais.reste.toLocaleString()} GNF à payer</p>
                  <p className="text-xs text-green-600">{((enfant.frais.paye / enfant.frais.total) * 100).toFixed(0)}% payé</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedEnfant && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-gray-800 mb-4">Mode de paiement</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => setModePaiement("especes")}
                className={`p-3 border rounded-lg text-center ${
                  modePaiement === "especes" ? "border-green-500 bg-green-50" : ""
                }`}
              >
                <Wallet className="w-6 h-6 mx-auto mb-1 text-green-600" />
                <span className="text-sm">Espèces</span>
              </button>
              <button
                onClick={() => setModePaiement("orange_money")}
                className={`p-3 border rounded-lg text-center ${
                  modePaiement === "orange_money" ? "border-orange-500 bg-orange-50" : ""
                }`}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                <span className="text-sm">Orange Money</span>
              </button>
              <button
                onClick={() => setModePaiement("carte")}
                className={`p-3 border rounded-lg text-center ${
                  modePaiement === "carte" ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <span className="text-sm">Carte Visa</span>
              </button>
            </div>

            <button
              onClick={handlePaiement}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              {loading ? "Traitement..." : `Payer ${selectedEnfant.frais.reste.toLocaleString()} GNF`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}