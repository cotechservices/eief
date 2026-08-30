"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Printer, GraduationCap, Users, FileText, ChevronDown, ChevronUp } from "lucide-react";
import QRCode from "react-qr-code";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function BulletinsDirecteurPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasse, setSelectedClasse] = useState("");

  const [bulletins, setBulletins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedBulletin, setExpandedBulletin] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Read class_id from URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const classId = params.get("classe_id");
      if (classId) {
        setSelectedClasse(classId);
      }
    }
  }, []);

  // 1. Fetch Classes
  useEffect(() => {
    fetch("/api/directeur_etudes/bulletins?action=classes")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
      })
      .catch(console.error);
  }, []);

  // 2. Fetch Bulletins
  useEffect(() => {
    if (!selectedClasse) {
      setBulletins([]);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`/api/directeur_etudes/bulletins?action=bulletins&classe_id=${selectedClasse}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBulletins(data);
        } else {
          setError(data.error || "Erreur lors du chargement des bulletins.");
        }
      })
      .catch(() => setError("Erreur de connexion."))
      .finally(() => setLoading(false));
  }, [selectedClasse]);

  const handlePrint = () => {
    window.print();
  };

  const toggleBulletin = (index: number) => {
    setExpandedBulletin(expandedBulletin === index ? null : index);
  };

  const formatNumber = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return num.toFixed(decimals).replace('.', ',');
  };

  const getClasseName = () => {
    const classe = classes.find(c => c.id === parseInt(selectedClasse));
    return classe ? `${classe.nom}` : '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* En-tête de page pour l'écran */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Bulletins Scolaires
        </h1>
        <p className="text-gray-900 mt-1">Générez et imprimez les bulletins des élèves par classe (Format PDF Officiel).</p>
      </div>

      {/* Filtres (écran) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-end print:hidden">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Classe
          </label>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors"
          >
            <option value="">Sélectionner une classe</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
            ))}
          </select>
        </div>

        {bulletins.length > 0 && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            <Printer className="w-5 h-5" />
            Tout imprimer
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center p-12 print:hidden">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl print:hidden">
          {error}
        </div>
      )}

      {!loading && selectedClasse && bulletins.length === 0 && !error && (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 print:hidden">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucun bulletin disponible</h3>
        </div>
      )}

      {/* Rendu des Bulletins */}
      <div ref={printRef} className="bulletins-container space-y-12">
        {bulletins.map((bulletin, index) => {
          const stats = bulletin.stats || {};
          const effectif = stats.effectif || 0;
          const moyenneClasse = parseFloat(stats.moyenne_classe) || 0;
          const meilleureMoyenne = parseFloat(stats.meilleure_moyenne) || 0;
          const plusFaibleMoyenne = parseFloat(stats.plus_faible_moyenne) || 0;

          // Données du graphe
          const chartData = [
            { name: "PERIODE 1", note: 6.85 }, // Données fictives pour l'instant
            { name: "PERIODE 2", note: 7.56 }, // À remplacer par les vraies moyennes passées
            { name: "PERIODE 3", note: bulletin.moyenneGenerale }
          ];

          // Calcul des totaux de coeffs
          const totalCoeff = bulletin.matieres.reduce((sum: number, m: any) => sum + parseInt(m.coefficient), 0);
          const totalMoyCoeff = bulletin.matieres.reduce((sum: number, m: any) => sum + (m.moyenne * parseInt(m.coefficient)), 0);

          return (
            <div
              key={bulletin.eleve.id}
              className="bulletin-page bg-white print:break-inside-avoid print:page-break-after-always print:shadow-none print:border-none border border-gray-200 rounded-xl overflow-hidden mb-12"
            >
              {/* Résumé cliquable (seulement à l'écran) */}
              <div
                className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer print:hidden hover:bg-gray-100 transition"
                onClick={() => toggleBulletin(index)}
              >
                <div>
                  <h3 className="font-bold text-lg">{bulletin.eleve.nom} {bulletin.eleve.prenom}</h3>
                  <p className="text-sm text-gray-600">Moyenne: {bulletin.moyenneGenerale.toFixed(2)}/20 - Rang: {bulletin.rang}e</p>
                </div>
                {expandedBulletin === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>

              {/* CONTENU EXACT DU BULLETIN (Visible à l'impression, ou si déroulé à l'écran) */}
              <div className={`p-[1cm] ${expandedBulletin === index ? 'block' : 'hidden'} print:block text-black bg-white`} style={{ fontFamily: "Times New Roman, serif" }}>

                {/* 1. En-tête principal (Bordure noire) */}
                <div className="border border-black p-2 flex items-center justify-between mb-2">
                  <div className="w-[120px] flex-shrink-0 text-center">
                    {/* Logo */}
                    <div className="border border-green-600 p-1 inline-block mx-auto">
                      <div className="text-red-600 font-bold text-xl leading-none">E.I.E.F</div>
                      <div className="text-[8px] text-green-700 leading-tight">ECOLE INTERNATIONALE<br />LES ENFANTS DU FUTUR</div>
                      <div className="text-[9px] text-red-600 font-bold mt-1">FAISONS PLUS !</div>
                    </div>
                  </div>
                  <div className="flex-1 text-center leading-tight">
                    <h1 className="font-bold text-[16px] uppercase">REPUBLIQUE DE GUINEE</h1>
                    <p className="text-[14px]">Travail - Justice - Solidarité</p>
                    <p className="font-bold text-[15px] mt-1">MEPU-A</p>
                    <h2 className="font-bold text-[15px] uppercase mt-1">ECOLE INTERNATIONALE LES ENFANTS DU FUTUR</h2>
                    <p className="text-[14px]">FAISONS PLUS</p>
                    <p className="text-[13px]">+224625549579/664039841</p>
                  </div>
                  <div className="w-[120px] flex-shrink-0"></div>
                </div>

                {/* 2. Titre et Période */}
                <div className="flex justify-between items-end mb-1 mt-4">
                  <div className="border border-black px-4 py-1 font-bold text-[18px] w-[350px] text-center tracking-widest">
                    BULLETIN DE NOTES
                  </div>
                  <div className="font-bold text-[18px]">
                    PERIODE 3
                  </div>
                </div>

                <div className="flex justify-between items-center mb-2 mt-1">
                  <div className="font-bold text-[14px]">Cycle : PRIMAIRE</div>
                  <div className="font-bold text-[14px]">Année Académique : 2025-2026</div>
                </div>

                {/* 3. Informations de l'élève */}
                <div className="border border-black flex h-[100px] mb-2 mt-1">
                  <div className="w-[100px] border-r border-black flex items-center justify-center overflow-hidden bg-gray-200">
                    {/* Silhouette de l'élève */}
                    <div className="w-full h-full text-gray-900">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full scale-125 translate-y-3">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 p-2 text-[13px] leading-relaxed flex">
                    <div className="w-[170px]">
                      <p>Matricule :</p>
                      <p>Nom :</p>
                      <p>Prénoms :</p>
                      <p>Date et Lieu Naissance :</p>
                      <p>Classe :</p>
                    </div>
                    <div className="flex-1 font-bold uppercase">
                      <p>{bulletin.eleve.matricule}</p>
                      <p>{bulletin.eleve.nom}</p>
                      <p>{bulletin.eleve.prenom}</p>
                      <p>16/09/2015 à : CONAKRY</p> {/* Fictif pour match PDF */}
                      <p>{getClasseName()}</p>
                    </div>
                  </div>
                  <div className="w-[90px] p-2 flex items-center justify-center">
                    <QRCode value={bulletin.eleve.matricule} size={80} level="L" />
                  </div>
                </div>

                {/* 4. Tableau des notes */}
                <table className="w-full border-collapse border border-black text-[12px] mb-2">
                  <thead>
                    <tr className="bg-gray-300 font-bold uppercase">
                      <th className="border border-black p-1 text-left">MATIERES</th>
                      <th className="border border-black p-1">MOYENNE</th>
                      <th className="border border-black p-1">COEFFICIENT</th>
                      <th className="border border-black p-1">MOYENNE COEFF</th>
                      <th className="border border-black p-1">MENTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletin.matieres.map((m: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-black p-1 uppercase">{m.matiere}</td>
                        <td className="border border-black p-1 text-center">{formatNumber(m.moyenne, 1).replace(',0', '')}</td>
                        <td className="border border-black p-1 text-center">{m.coefficient}</td>
                        <td className="border border-black p-1 text-center">{formatNumber(m.moyenne * m.coefficient, 1).replace(',0', '')}</td>
                        <td className="border border-black p-1 uppercase pl-2">{m.mention}</td>
                      </tr>
                    ))}
                    {/* TOTAL */}
                    <tr className="font-bold">
                      <td className="border border-black p-1 uppercase">TOTAL DES POINTS</td>
                      <td className="border border-black p-1 text-center"></td>
                      <td className="border border-black p-1 text-center text-[14px]">{totalCoeff}</td>
                      <td className="border border-black p-1 text-center text-[14px]">{formatNumber(totalMoyCoeff, 1).replace(',0', '')}</td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. Section Bas de page */}
                <div className="flex gap-4">
                  {/* Gauche : Evaluations et Stats */}
                  <div className="w-1/2">
                    <table className="w-full border-collapse border border-black text-[12px] mb-4">
                      <thead>
                        <tr className="bg-gray-300 font-bold">
                          <th className="border border-black p-1 text-center">Evaluations</th>
                          <th className="border border-black p-1 text-center">Moy/</th>
                          <th className="border border-black p-1 text-center">Rang</th>
                          <th className="border border-black p-1 text-center">Mention</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-1 uppercase">PERIODE 1</td>
                          <td className="border border-black p-1 text-center">6,85</td>
                          <td className="border border-black p-1 text-center">16e</td>
                          <td className="border border-black p-1 text-center uppercase">ASSEZ BIEN</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1 uppercase">PERIODE 2</td>
                          <td className="border border-black p-1 text-center">7,56</td>
                          <td className="border border-black p-1 text-center">8e</td>
                          <td className="border border-black p-1 text-center uppercase">BIEN</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1 uppercase">PERIODE 3</td>
                          <td className="border border-black p-1 text-center font-bold">{formatNumber(bulletin.moyenneGenerale, 2)}</td>
                          <td className="border border-black p-1 text-center font-bold">{bulletin.rang}e</td>
                          <td className="border border-black p-1 text-center font-bold uppercase">{bulletin.matieres[0]?.mention || 'BIEN'}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex flex-wrap text-[12px] gap-y-1">
                      <div className="w-[55%]">
                        <span>Effectif de la classe: </span><span className="font-bold ml-1">{effectif}</span>
                      </div>
                      <div className="w-[45%]">
                        <span>Moy de la classe: </span><span className="font-bold ml-1">{formatNumber(moyenneClasse, 2)}</span>
                      </div>
                      <div className="w-[55%]">
                        <span>Moy plus élévée: </span><span className="font-bold ml-1">{formatNumber(meilleureMoyenne, 2)}</span>
                      </div>
                      <div className="w-[45%]">
                        <span>Moy plus faible: </span><span className="font-bold ml-1">{formatNumber(plusFaibleMoyenne, 2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Droite : Graphique */}
                  <div className="w-1/2 flex flex-col items-center">
                    <h3 className="font-bold text-[13px] mb-2">Graphe des Evaluations</h3>
                    <div className="w-[300px] h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid vertical={false} stroke="#ccc" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Times New Roman' }} axisLine={{ stroke: '#000' }} tickLine={false} dy={10} />
                          <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tick={{ fontSize: 10, fontFamily: 'Times New Roman' }} axisLine={{ stroke: '#000' }} tickLine={true} dx={-5} />
                          <Line type="linear" dataKey="note" stroke="#4a90e2" strokeWidth={2} dot={{ r: 4, fill: "#4a90e2" }} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 6. Signatures */}
                <div className="flex mt-8 border border-black">
                  <div className="w-1/2 bg-gray-300 font-bold text-center text-[13px] py-1 border-r border-black">
                    Visa de la DIRECTION
                  </div>
                  <div className="w-1/2 bg-gray-300 font-bold text-center text-[13px] py-1">
                    Visa du Parent
                  </div>
                </div>
                <div className="flex border-b border-l border-r border-black h-[60px]">
                  <div className="w-1/2 border-r border-black"></div>
                  <div className="w-1/2"></div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* CSS d'impression Strict */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bulletins-container {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
          }
          .bulletins-container * {
            visibility: visible;
          }
          .bulletin-page {
            page-break-after: always !important;
            break-inside: avoid !important;
            width: 210mm;
            min-height: 297mm;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
}