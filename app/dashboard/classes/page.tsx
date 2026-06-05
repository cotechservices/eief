"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  salle: string;
  capaciteMax: number;
  _count?: { eleves: number };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    niveau: "",
    salle: "",
    capaciteMax: 30,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ nom: "", niveau: "", salle: "", capaciteMax: 30 });
        fetchClasses();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette classe ?")) return;
    try {
      await fetch(`/api/classes/${id}`, { method: "DELETE" });
      fetchClasses();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des classes</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "+ Nouvelle classe"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouvelle classe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-900 mb-1">Nom de la classe</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-1">Niveau</label>
                <input
                  type="text"
                  value={formData.niveau}
                  onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-1">Salle</label>
                <input
                  type="text"
                  value={formData.salle}
                  onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-1">Capacité maximale</label>
                <input
                  type="number"
                  value={formData.capaciteMax}
                  onChange={(e) => setFormData({ ...formData, capaciteMax: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Créer la classe
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des classes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Salle</TableHead>
                <TableHead>Élèves</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classe) => (
                <TableRow key={classe.id}>
                  <TableCell className="font-medium">{classe.nom}</TableCell>
                  <TableCell>{classe.niveau}</TableCell>
                  <TableCell>{classe.salle || "-"}</TableCell>
                  <TableCell>{classe._count?.eleves || 0}</TableCell>
                  <TableCell>{classe.capaciteMax}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(classe.id)}>🗑️</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}