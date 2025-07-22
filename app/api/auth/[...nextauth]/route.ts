import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import User from "@/lib/models/user"
import { connectToDatabase } from "@/lib/mongodb"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase()
        const user = await User.findOne({ email: credentials?.email })

        if (user && credentials?.password && bcrypt.compareSync(credentials.password, user.password || "")) {
          return { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
        }
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh every 24h
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role // Add role to token
      }
      if (account?.provider === "google" && user) {
        await connectToDatabase()
        let existingUser = await User.findOne({ email: user.email })
        if (!existingUser) {
          existingUser = await User.create({
            email: user.email,
            name: user.name,
            role: "user",
          })
        }
        token.id = existingUser._id.toString()
        token.role = existingUser.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as "user" | "admin" // Add role to session
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
