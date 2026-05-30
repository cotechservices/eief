// components/YouTubeGallery.tsx
"use client";

import { useState } from "react";
import { ChevronRight, Play, Calendar, Eye } from "lucide-react";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  views: string;
  date: string;
  url: string;
  thumbnail?: string;
}

// Fonction pour extraire l'ID d'une vidéo YouTube à partir de l'URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

const videos: Video[] = [
  {
    id: "gWJi5Vx50zI",
    url: "https://youtu.be/gWJi5Vx50zI?si=0S_BCBOqMikzSiSK",
    title: "Présentation de l'école - Journée portes ouvertes",
    views: "537",
    date: "1 mois",
  },
  {
    id: "O_z98nK2CAY",
    url: "https://youtu.be/O_z98nK2CAY?si=Zpbrigz8DiyIMr4S",
    title: "𝗟𝗮 𝗰𝗵𝗶𝗰𝗼𝘁𝘁𝗲 𝗮-𝘁-𝗲𝗹𝗹𝗲 𝗲𝗻𝗰𝗼𝗿𝗲 𝘀𝗮 𝗽𝗹𝗮𝗰𝗲 à 𝗹’é𝗰𝗼𝗹𝗲 ? 𝗗𝗶𝘀𝗰𝗶𝗽𝗹𝗶𝗻𝗲 𝗼𝘂 𝗺𝗮𝗹𝘁𝗿𝗮𝗶𝘁𝗮𝗻𝗰𝗲 ? ",
    views: "215",
    date: "1 mois",
  },
  {
    id: "VIDEO_ID_3",
    url: "https://youtu.be/VIDEO_ID_3",
    title: "Célébration de la journée de l'excellence",
    views: "281",
    date: "1 mois",
  },
  {
    id: "VIDEO_ID_4",
    url: "https://youtu.be/VIDEO_ID_4",
    title: "Nos élèves à la compétition de mathématiques",
    views: "356",
    date: "2 mois",
  },
  {
    id: "VIDEO_ID_5",
    url: "https://youtu.be/VIDEO_ID_5",
    title: "Séance de lecture à la bibliothèque",
    views: "125",
    date: "3 mois",
  },
  {
    id: "VIDEO_ID_6",
    url: "https://youtu.be/VIDEO_ID_6",
    title: "Cours d'anglais interactif",
    views: "52",
    date: "3 mois",
  },
];

export default function YouTubeGallery() {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dernières vidéos
          </h2>
          <p className="text-gray-600 mt-1">
            Découvrez notre chaîne YouTube et suivez l'actualité de l'école
          </p>
        </div>
        <a
          href="https://www.youtube.com/@eief-enfantsdufutur"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-md hover:shadow-lg"
        >
          <Play className="w-4 h-4" />
          S'abonner à la chaîne
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Grille de vidéos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
            onMouseEnter={() => setHoveredVideo(video.id)}
            onMouseLeave={() => setHoveredVideo(null)}
          >
            {/* Miniature vidéo avec overlay */}
            <div className="relative aspect-video bg-gray-900 overflow-hidden">
              {hoveredVideo === video.id ? (
                // Lecture automatique au survol
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                  title={video.title}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {/* Image miniature YouTube */}
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      // Fallback si l'image maxresdefault n'existe pas
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                    }}
                  />
                  {/* Overlay play button */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Informations vidéo */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition line-clamp-2">
                {video.title}
              </h3>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Il y a {video.date}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {video.views} vues
                </span>
              </div>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Regarder sur YouTube
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton pour voir plus de vidéos */}
      <div className="text-center mt-10">
        <a
          href="https://www.youtube.com/@eief-enfantsdufutur/videos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition"
        >
          Voir toutes les vidéos
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}