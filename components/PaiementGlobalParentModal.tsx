// components/PaiementGlobalParentModal.tsx
"use client";

import { useEffect, useState } from "react";
import PaiementGlobalModal from "@/components/PaiementGlobalModal";

interface SoldeGlobal {
  total: number;
  details: {
    inscription: number;
    transport: number;
    cantine: number;
    fournitures: number;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Solde calculé côté dashboard, utilisé comme repli avant le chargement API. */
  soldeRestant: number;
}

export default function PaiementGlobalParentModal({
  isOpen,
  onClose,
  onSuccess,
  soldeRestant,
}: Props) {
  const [solde, setSolde] = useState<SoldeGlobal | null>(null);

  useEffect(() => {
    let annule = false;

    const charger = async () => {
      try {
        const response = await fetch("/api/parent/solde-global");
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        const data: SoldeGlobal = await response.json();
        if (!annule) setSolde(data);
      } catch (error) {
        console.error("Impossible de charger le détail du solde global:", error);
      }
    };

    charger();
    return () => {
      annule = true;
    };
  }, [isOpen]);

  const soldeAffiche: SoldeGlobal = solde || {
    total: soldeRestant || 0,
    details: {
      inscription: soldeRestant || 0,
      transport: 0,
      cantine: 0,
      fournitures: 0,
    },
  };

  return (
    <PaiementGlobalModal
      key={JSON.stringify(soldeAffiche)}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={() => {
        // Le solde est rechargé à la réouverture du modal.
        onSuccess();
      }}
      solde={soldeAffiche}
    />
  );
}
