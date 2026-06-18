"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CantinePage() {
  const searchParams = useSearchParams();
  const enfantId = searchParams.get("enfantId");
  const [cantineOptions, setCantineOptions] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enfantId) return;
    const fetchOptions = async () => {
      try {
        const res = await fetch(`/api/parent/cantine?enfantId=${enfantId}`);
        const data = await res.json();
        setCantineOptions(data.options || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [enfantId]);

  if (!enfantId) {
    return <div className="p-4">Enfant non spécifié.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sélection de la cantine pour l'enfant #{enfantId}</h1>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul className="space-y-4">
          {cantineOptions.map((opt) => (
            <li key={opt.id} className="flex items-center justify-between p-4 bg-white rounded shadow">
              <span>{opt.name}</span>
              <span>{opt.price.toLocaleString()} GNF</span>
              <Link
                href={`/dashboard/parent/cantine/subscribe?enfantId=${enfantId}&optionId=${opt.id}`}
                className="ml-4 bg-pink-600 text-white px-3 py-1 rounded hover:bg-pink-700"
              >
                S'abonner
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}