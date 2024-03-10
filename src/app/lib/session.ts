import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prismaClient } from "@/lib/prisma/client";
import { Routes } from "@/routes";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: Routes.SignIn,
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    signIn: async ({ user }) => {
      const email = user.email;

      if (!email) return false;

      const existingUser = await prismaClient.user.findUnique({
        where: { email },
        select: {
          email: true,
        },
      });

      if (!existingUser) {
        await prismaClient.user.create({
          data: {
            email: email,
            googleId: user.id,
            name: user.name,
            imageUrl: user.image,
          },
        });
      }

      // update user picture

      return true;
    },

    jwt: async ({ user, token }) => {
      const email = user?.email;
      if (!email) return token;

      const dbUser = await prismaClient.user.findUnique({
        where: { email },
        select: {
          id: true,
        },
      });

      if (dbUser) {
        token.id = dbUser.id;
      }

      return token;
    },

    session: async ({ token, session }) => {
      if (!session.user) return session;
      session.user.id = token.id as string;
      return session;
    },
  },
};

export async function getLoggedInUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id;
}
