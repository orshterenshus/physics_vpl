import mongoose, { Schema } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  loginCode: string | null;
  passwordHash: string | null;
  mustChangePassword: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    loginCode: { type: String, default: null },
    // Only set for admin accounts — students/teachers are invite-only via loginCode.
    passwordHash: { type: String, default: null },
    // Forces a password change on next login after (re)setting an admin's password.
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Always delete the cached model so schema changes take effect after HMR.
// Safe in production too — the model is simply recreated on the first request.
delete (mongoose.models as Record<string, unknown>)["User"];
export const User = mongoose.model<IUser>("User", UserSchema);
