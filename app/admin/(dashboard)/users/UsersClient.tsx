"use client";

import { useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

type UserRow = {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: "PATIENT";
  createdAt: string | Date;
};

export default function UsersClient({
  initialUsers,
}: {
  initialUsers: UserRow[];
}) {
  const [users, setUsers] = useState<UserRow[]>(
    initialUsers.map((u) => ({
      ...u,
      createdAt: new Date(u.createdAt).toISOString(),
    }))
  );

  const [search, setSearch] = useState("");

  // Create modal state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSurname, setNewSurname] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit modal state
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSurname, setEditSurname] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = `${u.name ?? ""} ${u.surname ?? ""}`.trim().toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        name.includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  async function createUser() {
    if (!newEmail || !newPassword) {
      toast.error("Email and password are required.");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim() || undefined,
        surname: newSurname.trim() || undefined,
        email: newEmail,
        password: newPassword,
      }),
    });

    const data = await res.json().catch(() => null);
    setCreating(false);

    if (!res.ok) {
      toast.error(
        data?.error?.message || data?.error || "Failed to create user."
      );
      return;
    }

    setUsers((prev) => [
      { ...data.user, createdAt: new Date(data.user.createdAt).toISOString() },
      ...prev,
    ]);
    toast.success("Patient created successfully.");

    setNewName("");
    setNewSurname("");
    setNewEmail("");
    setNewPassword("");
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setEditName(u.name ?? "");
    setEditSurname(u.surname ?? "");
    setEditEmail(u.email);
  }

  async function saveEdit() {
    if (!editing) return;

    const res = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim() ? editName.trim() : null,
        surname: editSurname.trim() ? editSurname.trim() : null,
        email: editEmail.trim() || undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(
        data?.error?.message || data?.error || "Failed to update user."
      );
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === editing.id ? { ...u, ...data.user } : u))
    );
    toast.success("User updated.");
    setEditing(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this patient? This cannot be undone.")) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error || "Failed to delete user.");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("User deleted.");
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name/email/user id…"
            className="w-full sm:w-96 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
          <button
            onClick={() =>
              toast.info("Use the form below to create a patient.")
            }
            className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Help
          </button>
        </div>

        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-800">{filtered.length}</span>{" "}
          patient(s)
        </div>
      </div>

      {/* Create */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Create patient</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="First name (optional)"
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
          />
          <input
            value={newSurname}
            onChange={(e) => setNewSurname(e.target.value)}
            placeholder="Surname (optional)"
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
          />
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm sm:col-span-1"
          />
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            type="password"
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm sm:col-span-1"
          />
        </div>
        <button
          onClick={createUser}
          disabled={creating}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create patient"}
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
          <div className="col-span-4">Patient</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No patients found.</div>
        ) : (
          filtered.map((u) => {
            const name =
              `${u.name ?? ""} ${u.surname ?? ""}`.trim() || "Patient";
            return (
              <div key={u.id} className="border-b last:border-b-0 px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center">
                  <div className="md:col-span-4">
                    <div className="text-sm font-medium text-gray-900">
                      {name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {u.id}
                    </div>
                  </div>
                  <div className="md:col-span-3 text-sm text-gray-700">
                    {u.email}
                  </div>
                  <div className="md:col-span-3 text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleString()}
                  </div>
                  <div className="md:col-span-2 md:justify-self-end flex gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit patient
            </h3>

            <div className="mt-4 space-y-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              />
              <input
                value={editSurname}
                onChange={(e) => setEditSurname(e.target.value)}
                placeholder="Surname"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              />
              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
