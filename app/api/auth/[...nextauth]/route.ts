//app\api\auth\[...nextauth]\route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Ajouter une log pour vérifier que le fichier est bien chargé
console.log("✅ Route auth chargée avec succès");