// app/programmes/page.tsx - Version sans âge
"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Globe, Palette, Music, Trophy, Code, GraduationCap, Award, ArrowRight, Target, Sparkles, Brain, Users } from "lucide-react";

export default function ProgrammesPage() {
  const niveaux = [
    {
      id: "maternelle",
      niveau: "Crèches et Maternelle",
      description: "Éveil, socialisation et développement des compétences fondamentales",
      descriptionDetaillee: "La maternelle est une étape cruciale dans le développement de l'enfant. Notre programme favorise l'éveil sensoriel, la motricité fine et globale, ainsi que l'apprentissage de la vie en collectivité. Les enfants découvrent le monde qui les entoure à travers le jeu, le langage et les activités artistiques.",
      competences: ["Motricité fine et globale", "Langage oral", "Socialisation", "Créativité", "Autonomie"],
      color: "bg-green-500",
      objectif: "Préparer l'enfant à l'entrée au primaire",
      lienInscription: "/register?niveau=maternelle"
    },
    {
      id: "primaire",
      niveau: "Primaire",
      description: "Acquisition des connaissances fondamentales",
      descriptionDetaillee: "Le primaire constitue le socle de la scolarité où l'enfant acquiert les compétences essentielles en lecture, écriture et calcul. Notre approche pédagogique combine rigueur académique et méthodes actives pour développer la curiosité intellectuelle et le goût d'apprendre.",
      competences: ["Lecture et écriture", "Raisonnement mathématique", "Culture générale", "Esprit critique", "Travail en équipe"],
      color: "bg-blue-500",
      objectif: "Préparation au CEE",
      lienInscription: "/register?niveau=primaire"
    },
    {
      id: "college",
      niveau: "Collège",
      description: "Approfondissement des matières principales",
      descriptionDetaillee: "Le collège marque une étape de transition importante où les élèves approfondissent leurs connaissances et découvrent de nouvelles disciplines. Notre programme les prépare à l'autonomie intellectuelle et à la rigueur nécessaire pour les examens tout en développant leur sens des responsabilités.",
      competences: ["Raisonnement scientifique", "Analyse littéraire", "Langues vivantes", "Méthodologie", "Organisation personnelle"],
      color: "bg-purple-500",
      objectif: "Préparation au BEPC",
      lienInscription: "/register?niveau=college"
    },
    {
      id: "lycee",
      niveau: "Lycée",
      description: "Préparation au baccalauréat unique",
      descriptionDetaillee: "Le lycée prépare les élèves aux études supérieures et à la vie active. Notre programme, conforme au Baccalauréat Unique Guinéen, offre un équilibre entre formation générale et spécialisation selon les séries choisies. Nous accompagnons chaque élève dans son projet d'orientation.",
      competences: ["Maîtrise des connaissances", "Autonomie intellectuelle", "Esprit d'analyse", "Préparation aux études supérieures", "Projet professionnel"],
      series: ["Série S (Scientifique)", "Série L (Littéraire)", "Série SE (Sciences Économiques)", "Série G (Gestion)"],
      color: "bg-red-500",
      objectif: "Préparation au BAC unique guinéen",
      lienInscription: "/register?niveau=lycee"
    }
  ];

  const activites = [
    { icon: Trophy, name: "Sport", description: "Football, basketball, athlétisme, judo" },
    { icon: Palette, name: "Arts", description: "Dessin, peinture, artisanat local" },
    { icon: Music, name: "Musique", description: "Instruments traditionnels, chorale" },
    { icon: Code, name: "Robotique", description: "Programmation, nouvelles technologies" },
    { icon: BookOpen, name: "Club de lecture", description: "Bibliothèque, ateliers d'écriture" },
    { icon: Globe, name: "Langues", description: "Anglais, arabe, langues nationales" }
  ];

  const diplomes = [
    { nom: "CEE", description: "Certificat d'Études Élémentaires", niveau: "Fin primaire" },
    { nom: "BEPC", description: "Brevet d'Études du Premier Cycle", niveau: "Fin collège" },
    { nom: "BAC", description: "Baccalauréat Unique Guinéen", niveau: "Fin lycée" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[300px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos programmes scolaires</h1>
            <p className="text-xl max-w-2xl">
              Un parcours éducatif conforme au système éducatif guinéen, de la maternelle au baccalauréat
            </p>
          </div>
        </div>
      </div>

      {/* Niveaux scolaires */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Le parcours scolaire</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {niveaux.map((niveau, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className={`${niveau.color} p-5 text-white`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">{niveau.niveau}</h3>
                    </div>
                    <GraduationCap className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 font-medium mb-3">{niveau.description}</p>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {niveau.descriptionDetaillee}
                  </p>
                  
                  {/* Compétences clés */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Compétences développées :
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {niveau.competences.map((competence, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          {competence}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Séries pour lycée */}
                  {niveau.series && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        Séries proposées :
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {niveau.series.map((serie, i) => (
                          <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                            {serie}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Objectif + Bouton côte à côte */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">
                        {niveau.objectif}
                      </p>
                    </div>
                    <Link
                      href={niveau.lienInscription}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      S'inscrire
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diplômes */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Diplômes préparés</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Notre école prépare les élèves aux diplômes officiels du système éducatif guinéen
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {diplomes.map((diplome, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{diplome.nom}</h3>
                <p className="text-gray-600 mb-2">{diplome.description}</p>
                <span className="text-sm text-blue-600 font-medium">{diplome.niveau}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs pédagogiques */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre approche pédagogique</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une éducation qui allie excellence académique et développement personnel
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Encadrement personnalisé</h3>
              <p className="text-gray-600">Des classes à effectif réduit pour un suivi individualisé de chaque élève</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pédagogie active</h3>
              <p className="text-gray-600">Des méthodes innovantes qui placent l'élève au cœur de son apprentissage</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Formation complète</h3>
              <p className="text-gray-600">Un équilibre entre matières académiques et développement personnel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activités extrascolaires */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Activités extrascolaires</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Pour un développement équilibré de l'enfant
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activites.map((activite, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                  <activite.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{activite.name}</h3>
                <p className="text-gray-600">{activite.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendrier scolaire */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Calendrier scolaire</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              L'année scolaire en Guinée s'étend d'octobre à juin
            </p>
          </div>
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Octobre</div>
                <div className="text-gray-600">Rentrée scolaire</div>
                <div className="text-sm text-gray-500">Début des cours</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Décembre-Juin</div>
                <div className="text-gray-600">Période des examens</div>
                <div className="text-sm text-gray-500">BEPC, BAC</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Juin</div>
                <div className="text-gray-600">Fin de l'année scolaire</div>
                <div className="text-sm text-gray-500">Délibérations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}