"use client";

import { useState } from "react";
import { IUser } from "@/models/User";

interface UserWithId extends Omit<IUser, "_id"> {
  _id: string;
}

const inputCls = "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500";

export function UserTable({ initialUsers }: { initialUsers: UserWithId[] }) {
  const [users, setUsers] = useState<UserWithId[]>(initialUsers);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "student" as IUser["role"], password: "" });
  const [formError, setFormError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        form.role === "admin" ? form : { name: form.name, email: form.email, role: form.role }
      ),
    });
    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error ?? "Failed to create user");
      return;
    }
    const { user, code } = await res.json();
    setUsers((u) => [user, ...u]);
    if (code) setCodes((c) => ({ ...c, [user._id]: code }));
    setForm({ name: "", email: "", role: "student", password: "" });
    setCreating(false);
  }

  async function handleGenerateCode(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/generate-code`, { method: "POST" });
    if (res.ok) {
      const { code } = await res.json();
      setCodes((c) => ({ ...c, [userId]: code }));
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to generate code");
    }
  }

  async function handleSetPassword(userId: string) {
    const password = prompt("New password for this admin (min 8 characters):");
    if (!password) return;
    const res = await fetch(`/api/admin/users/${userId}/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      alert("Password updated.");
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to set password");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x._id !== userId));
    setCodes((c) => { const n = { ...c }; delete n[userId]; return n; });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating((c) => !c)}
          className="bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {creating ? "Cancel" : "Add User"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white">New User</h2>
          <div className="grid grid-cols-3 gap-3">
            <input required placeholder="Full name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls} />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls} />
            <select value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as IUser["role"] }))}
              className={inputCls}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === "admin" && (
            <input required type="password" placeholder="Password (min 8 characters)" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputCls} />
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {form.role === "admin"
              ? "Admin accounts sign in with this password — no login code."
              : "A one-time login code will be generated after creating this account."}
          </p>
          {formError && <p className="text-red-500 dark:text-red-400 text-xs">{formError}</p>}
          <button type="submit"
            className="bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors self-end">
            {form.role === "admin" ? "Create Admin" : "Create & Generate Code"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Role</th>
              <th className="pb-3 pr-4">Login Code</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    u.role === "admin"   ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    : u.role === "teacher" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {u.role === "admin" ? (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">Signs in with password</span>
                  ) : codes[u._id] ? (
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono tracking-widest text-green-700 dark:text-green-400">
                        {codes[u._id]}
                      </code>
                      <button onClick={() => navigator.clipboard.writeText(codes[u._id])}
                        className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        Copy
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">
                      {u.loginCode ? "Active (hidden)" : "Used / not set"}
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-3 text-xs">
                    {u.role === "admin" ? (
                      <button onClick={() => handleSetPassword(u._id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                        Set new password
                      </button>
                    ) : (
                      <button onClick={() => handleGenerateCode(u._id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                        New code
                      </button>
                    )}
                    <button onClick={() => handleDelete(u._id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-gray-400 mt-4">No users yet.</p>}
      </div>
    </div>
  );
}
