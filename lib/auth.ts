import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "@/models/User";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { code: {}, email: {}, password: {} },
      async authorize(credentials) {
        await connectDB();

        // Admin login: email + password.
        const password = credentials?.password as string | undefined;
        if (password) {
          const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
          if (!email) return null;
          const user = await User.findOne({ email, role: "admin" });
          if (!user?.passwordHash) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
        }

        // Student/teacher login: one-time code.
        const code = (credentials?.code as string | undefined)?.trim().toUpperCase();
        if (!code) return null;
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
