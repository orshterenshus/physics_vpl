import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminUsersPage() {
  await connectDB();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Users</h1>
      <UserTable initialUsers={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
