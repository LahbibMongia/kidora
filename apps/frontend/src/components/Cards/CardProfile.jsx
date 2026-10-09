import React from "react";
import { useAuth } from "context/AuthContext.jsx";

export default function CardProfile() {
  const { user } = useAuth();
  const initials = (user?.name || "A").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <aside aria-label="Signed-in administrator" className="mb-6 rounded-xl border border-blueGray-100 bg-white p-6 text-center shadow-sm">
    <div aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blueGray-800 text-2xl font-bold text-white">{initials}</div>
    <h2 className="mt-4 text-xl font-semibold text-blueGray-800">{user?.name || "Administrator"}</h2>
    <p className="mt-1 text-sm capitalize text-blueGray-500">{user?.role || "Admin"}</p>
    <dl className="mt-5 space-y-3 border-t border-blueGray-100 pt-4 text-left text-sm">
      <div><dt className="font-medium text-blueGray-500">Email</dt><dd className="break-all text-blueGray-800">{user?.email || "Not provided"}</dd></div>
      <div><dt className="font-medium text-blueGray-500">Phone</dt><dd className="text-blueGray-800">{user?.phone || "Not provided"}</dd></div>
      <div><dt className="font-medium text-blueGray-500">Address</dt><dd className="text-blueGray-800">{user?.adresse || "Not provided"}</dd></div>
    </dl>
  </aside>;
}
