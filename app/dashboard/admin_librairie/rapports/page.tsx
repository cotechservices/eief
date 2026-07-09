// app/dashboard/admin_librairie/rapports/page.tsx
"use client";

import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import {
  BookOpen, Package, ShoppingCart, TrendingUp, Download,
  Printer, FileText, PieChart, BarChart3, Calendar,
  AlertCircle, Users, Box, Clock, CheckCircle, XCircle
} from "lucide-react";

interface Article {
  id: number;
  nom: string;
  description: string;
  prix_unitaire: number;
  quantite_stock: number;
  categorie: string;
  image_url?: string | null;
  created_at: string;
}

interface Commande {
  id: number;
  numero_commande: string;
  date_commande: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  total: number;
  parent_nom: string;
  parent_prenom: string;
  parent_email: string;
  parent_telephone: string;
}

interface Vente {
  id: number;
  article_id: number;
  article_nom: string;
  eleve_nom: string | null;
  quantite: number;
  montant_total: number;
  date_vente: string;
  vendeur: string;
}

interface CommandeArticle {
  id: number;
  article_id: number;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

export default function LibrairieRapportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [viewType, setViewType] = useState<'global' | 'articles' | 'commandes' | 'ventes'>('global');
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [showCommandeDetail, setShowCommandeDetail] = useState(false);
  const [commandeArticles, setCommandeArticles] = useState<CommandeArticle[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les articles
      const articlesRes = await fetch('/api/admin/librairie/articles');
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data);
      } else {
        // Fallback données du dump
        setArticles([
          {
            id: 1,
            nom: "Tenues scolaire",
            description: "Tenues scolaire",
            prix_unitaire: 200000,
            quantite_stock: 499941,
            categorie: "uniforme",
            image_url: "https://zwdpyhpbcrcccqgsthnc.supabase.co/storage/v1/object/public/preinscriptions/librairie/librairie_1781891201575_6492.jpg",
            created_at: "2026-06-19 17:46:47.023073"
          }
        ]);
      }

      // Récupérer les commandes
      const commandesRes = await fetch('/api/admin/librairie/commandes');
      if (commandesRes.ok) {
        const data = await commandesRes.json();
        setCommandes(data);
      } else {
        setCommandes([
          {
            id: 4,
            numero_commande: "CMD-2026-0001",
            date_commande: "2026-06-29 22:32:22.742042",
            statut: "en_attente",
            total: 200000,
            parent_nom: "Camara",
            parent_prenom: "Mohamed Kolomba",
            parent_email: "mohamedkc237@gmail.com",
            parent_telephone: "+224627421722"
          },
          {
            id: 5,
            numero_commande: "CMD-2026-0002",
            date_commande: "2026-06-29 22:32:59.793381",
            statut: "valide",
            total: 200000,
            parent_nom: "Camara",
            parent_prenom: "Mohamed Kolomba",
            parent_email: "mohamedkc237@gmail.com",
            parent_telephone: "+224627421722"
          },
          {
            id: 7,
            numero_commande: "CMD-2026-0003",
            date_commande: "2026-06-29 22:36:04.373381",
            statut: "valide",
            total: 200000,
            parent_nom: "Camara",
            parent_prenom: "Mohamed Kolomba",
            parent_email: "mohamedkc237@gmail.com",
            parent_telephone: "+224627421722"
          },
          {
            id: 8,
            numero_commande: "CMD-2026-0004",
            date_commande: "2026-06-29 22:54:40.515138",
            statut: "valide",
            total: 11400000,
            parent_nom: "Camara",
            parent_prenom: "Mohamed Kolomba",
            parent_email: "mohamedkc237@gmail.com",
            parent_telephone: "+224627421722"
          }
        ]);
      }

      // Récupérer les ventes
      const ventesRes = await fetch('/api/admin/librairie/ventes');
      if (ventesRes.ok) {
        const data = await ventesRes.json();
        setVentes(data);
      } else {
        setVentes([
          {
            id: 1,
            article_id: 1,
            article_nom: "Tenues scolaire",
            eleve_nom: null,
            quantite: 1,
            montant_total: 200000,
            date_vente: "2026-06-29 22:53:17.544232",
            vendeur: "Super Admin"
          },
          {
            id: 2,
            article_id: 1,
            article_nom: "Tenues scolaire",
            eleve_nom: null,
            quantite: 1,
            montant_total: 200000,
            date_vente: "2026-06-29 22:53:54.283158",
            vendeur: "Super Admin"
          },
          {
            id: 3,
            article_id: 1,
            article_nom: "Tenues scolaire",
            eleve_nom: null,
            quantite: 57,
            montant_total: 11400000,
            date_vente: "2026-06-29 22:56:10.762457",
            vendeur: "Super Admin"
          }
        ]);
      }

    } catch (error) {
      console.error("Erreur chargement données:", error);
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les articles d'une commande
  const fetchCommandeArticles = async (commandeId: number) => {
    try {
      const res = await fetch(`/api/admin/librairie/commandes/${commandeId}/articles`);
      if (res.ok) {
        const data = await res.json();
        setCommandeArticles(data);
      } else {
        // Fallback
        setCommandeArticles([
          { id: 1, article_id: 1, nom: "Tenues scolaire", quantite: 1, prix_unitaire: 200000, total: 200000 }
        ]);
      }
    } catch (error) {
      console.error("Erreur chargement articles commande:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistiques (sans finances)
  const stats = {
    totalArticles: articles.length,
    totalStock: articles.reduce((acc, a) => acc + a.quantite_stock, 0),
    totalCommandes: commandes.length,
    commandesEnAttente: commandes.filter(c => c.statut === 'en_attente').length,
    commandesValidees: commandes.filter(c => c.statut === 'valide').length,
    totalVentes: ventes.length,
    totalQuantiteVendue: ventes.reduce((acc, v) => acc + v.quantite, 0),
    articlesEnStock: articles.filter(a => a.quantite_stock > 0).length,
    articlesRupture: articles.filter(a => a.quantite_stock === 0).length,
  };

  const formatPrix = (valeur: number) => {
    return new Intl.NumberFormat('fr-FR').format(valeur);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validée</span>;
      case 'en_attente':
        return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case 'rejete':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetée</span>;
      default:
        return null;
    }
  };

  // ⭐ Exporter en Excel (XLSX)
  const exporterExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Feuille "Résumé"
      const resumeData = [
        ['RAPPORT LIBRAIRIE - E.I.E.F'],
        [`Date: ${new Date().toLocaleString()}`],
        [],
        ['Indicateur', 'Valeur'],
        ['Total articles', stats.totalArticles],
        ['Articles en stock', stats.articlesEnStock],
        ['Articles en rupture', stats.articlesRupture],
        ['Stock total', stats.totalStock],
        ['Total commandes', stats.totalCommandes],
        ['Commandes en attente', stats.commandesEnAttente],
        ['Commandes validées', stats.commandesValidees],
        ['Total ventes', stats.totalVentes],
        ['Articles vendus', stats.totalQuantiteVendue]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(resumeData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Résumé');

      // 2. Feuille "Articles"
      const articlesData = [
        ['ID', 'Nom', 'Description', 'Catégorie', 'Stock', 'Prix unitaire (GNF)'],
        ...articles.map(a => [
          a.id,
          a.nom,
          a.description || '',
          a.categorie,
          a.quantite_stock,
          a.prix_unitaire
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(articlesData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Articles');

      // 3. Feuille "Commandes"
      const commandesData = [
        ['ID', 'N° Commande', 'Parent', 'Email', 'Téléphone', 'Statut', 'Date', 'Total (GNF)'],
        ...commandes.map(c => [
          c.id,
          c.numero_commande,
          `${c.parent_prenom} ${c.parent_nom}`,
          c.parent_email,
          c.parent_telephone || '',
          c.statut === 'valide' ? 'Validée' : c.statut === 'en_attente' ? 'En attente' : 'Rejetée',
          new Date(c.date_commande).toLocaleDateString('fr-FR'),
          c.total
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(commandesData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Commandes');

      // 4. Feuille "Ventes"
      const ventesData = [
        ['ID', 'Article', 'Élève', 'Quantité', 'Date', 'Vendeur'],
        ...ventes.map(v => [
          v.id,
          v.article_nom,
          v.eleve_nom || 'Vente libre',
          v.quantite,
          new Date(v.date_vente).toLocaleDateString('fr-FR'),
          v.vendeur || 'Système'
        ])
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(ventesData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Ventes');

      // Ajuster les largeurs des colonnes
      [ws1, ws2, ws3, ws4].forEach(ws => {
        ws['!cols'] = [
          { wch: 25 },
          { wch: 25 },
          { wch: 30 },
          { wch: 15 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 20 }
        ];
      });

      // Générer et télécharger
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_librairie_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export Excel:", error);
      alert("Erreur lors de l'export Excel");
    }
  };

  const imprimer = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:block">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            Rapports Librairie
          </h1>
          <p className="text-gray-500 mt-1">Consultez les statistiques de la librairie</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={exporterExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter Excel
          </button>
          <button
            onClick={imprimer}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={fetchData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Statistiques - Sans données financières */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Articles</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalArticles}</p>
          <Package className="w-4 h-4 text-blue-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">En stock</p>
          <p className="text-2xl font-bold text-green-600">{stats.articlesEnStock}</p>
          <Box className="w-4 h-4 text-green-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Rupture</p>
          <p className="text-2xl font-bold text-red-600">{stats.articlesRupture}</p>
          <AlertCircle className="w-4 h-4 text-red-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Commandes</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalCommandes}</p>
          <ShoppingCart className="w-4 h-4 text-purple-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">En attente</p>
          <p className="text-2xl font-bold text-orange-600">{stats.commandesEnAttente}</p>
          <Clock className="w-4 h-4 text-orange-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Ventes</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalVentes}</p>
          <TrendingUp className="w-4 h-4 text-indigo-200 mt-1" />
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 print:hidden">
        <button
          onClick={() => setViewType('global')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'global' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PieChart className="w-4 h-4 inline mr-2" />
          Vue globale
        </button>
        <button
          onClick={() => setViewType('articles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'articles' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Articles ({articles.length})
        </button>
        <button
          onClick={() => setViewType('commandes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'commandes' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          Commandes ({commandes.length})
        </button>
        <button
          onClick={() => setViewType('ventes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'ventes' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Ventes ({ventes.length})
        </button>
      </div>

      {/* Vue globale */}
      {viewType === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Résumé de la librairie
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Articles disponibles</span>
                <span className="font-bold text-blue-600">{stats.totalArticles}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Articles en stock</span>
                <span className="font-bold text-green-600">{stats.articlesEnStock}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Articles en rupture</span>
                <span className="font-bold text-red-600">{stats.articlesRupture}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Commandes passées</span>
                <span className="font-bold text-purple-600">{stats.totalCommandes}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Commandes en attente</span>
                <span className="font-bold text-orange-600">{stats.commandesEnAttente}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ventes effectuées</span>
                <span className="font-bold text-indigo-600">{stats.totalVentes}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Dernières activités
            </h3>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Dernières ventes</h4>
              {ventes.slice(0, 3).map((vente) => (
                <div key={vente.id} className="flex justify-between items-center border-b border-gray-100 pb-2 text-sm">
                  <span className="text-gray-600">
                    {vente.quantite}x {vente.article_nom}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(vente.date_vente).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
              {ventes.length === 0 && (
                <p className="text-gray-500 text-sm">Aucune vente récente</p>
              )}
              
              <h4 className="text-sm font-medium text-gray-700 mt-3">Dernières commandes</h4>
              {commandes.slice(0, 3).map((commande) => (
                <div key={commande.id} className="flex justify-between items-center border-b border-gray-100 pb-2 text-sm">
                  <span className="font-mono text-xs text-purple-600">{commande.numero_commande}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
              {commandes.length === 0 && (
                <p className="text-gray-500 text-sm">Aucune commande récente</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vue Articles */}
      {viewType === 'articles' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Prix unitaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.image_url ? (
                          <img src={article.image_url} alt={article.nom} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{article.nom}</p>
                          <p className="text-xs text-gray-500">{article.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                        {article.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${article.quantite_stock === 0 ? 'text-red-600' : article.quantite_stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                        {article.quantite_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrix(article.prix_unitaire)} GNF
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucun article</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Commandes */}
      {viewType === 'commandes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N° Commande</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Parent</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandes.map((commande) => (
                  <tr key={commande.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => {
                    setSelectedCommande(commande);
                    fetchCommandeArticles(commande.id);
                    setShowCommandeDetail(true);
                  }}>
                    <td className="px-4 py-3 font-mono text-sm font-medium text-purple-700">
                      {commande.numero_commande}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{commande.parent_prenom} {commande.parent_nom}</p>
                      <p className="text-xs text-gray-500">{commande.parent_email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatutBadge(commande.statut)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                {commandes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucune commande</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Ventes */}
      {viewType === 'ventes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qté</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventes.map((vente) => (
                  <tr key={vente.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(vente.date_vente).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {vente.article_nom}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {vente.eleve_nom || "Vente libre"}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{vente.quantite}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {vente.vendeur || 'Système'}
                    </td>
                  </tr>
                ))}
                {ventes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucune vente</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Détail Commande */}
      {showCommandeDetail && selectedCommande && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  Détail de la commande
                </h2>
                <p className="text-sm text-gray-500 font-mono">{selectedCommande.numero_commande}</p>
              </div>
              <button onClick={() => setShowCommandeDetail(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Parent</p>
                    <p className="font-medium">{selectedCommande.parent_prenom} {selectedCommande.parent_nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedCommande.parent_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedCommande.parent_telephone || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    {getStatutBadge(selectedCommande.statut)}
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">Articles commandés</h3>
              <div className="space-y-2">
                {commandeArticles.map((article) => (
                  <div key={article.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{article.nom}</p>
                      <p className="text-xs text-gray-500">x{article.quantite} × {formatPrix(article.prix_unitaire)} GNF</p>
                    </div>
                    <p className="font-bold text-green-600">{formatPrix(article.total)} GNF</p>
                  </div>
                ))}
                {commandeArticles.length === 0 && (
                  <p className="text-gray-500 text-sm">Aucun article trouvé</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowCommandeDetail(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100 print:hidden">
        <p>Rapport généré le {new Date().toLocaleString()}</p>
        <p>© {new Date().getFullYear()} E.I.E.F - Module Librairie</p>
      </div>
    </div>
  );
}