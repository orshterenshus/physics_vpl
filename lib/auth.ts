import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./db";
import { User } from "@/models/User";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { code: {} },
      async authorize(credentials) {
        const code = (credentials?.code as string | undefined)?.trim().toUpperCase();
        if (!code) return null;
        await connectDB();
        const user = await User.findOne({ loginCode: code });
        if (!user) return null;
        // consume the code — one-time use
        await User.findByIdAndUpdate(user._id, { loginCode: null });
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "student" | "teacher" | "admin";
    };
  }
}
