// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Mot de passe",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const result = await query(
          "SELECT * FROM utilisateurs WHERE email = $1",
          [credentials.email]
        );

        const user = result.rows[0];

        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Mot de passe incorrect");
        }

        // Récupérer l'ID du parent si l'utilisateur est un parent
        let parentId = null;
        if (user.role === "PARENT") {
          const parentResult = await query(
            "SELECT id FROM parents WHERE utilisateur_id = $1",
            [user.id]
          );
          if (parentResult.rows.length > 0) {
            parentId = parentResult.rows[0].id;
          }
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          parentId: parentId,
          prenom: user.prenom,
          nom: user.nom,
          telephone: user.telephone,
          adresse: user.adresse,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.parentId = (user as any).parentId;
        token.prenom = (user as any).prenom;
        token.nom = (user as any).nom;
        token.telephone = (user as any).telephone;
        token.adresse = (user as any).adresse;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).parentId = token.parentId;
        (session.user as any).prenom = token.prenom;
        (session.user as any).nom = token.nom;
        (session.user as any).telephone = token.telephone;
        (session.user as any).adresse = token.adresse;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};