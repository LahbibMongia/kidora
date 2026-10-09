import React, { useEffect, useState } from "react";
import API from "service/api";
import { useAuth } from "context/AuthContext.jsx";

export default function CardSettings() {
  const { user, setUser } = useAuth();
  const [values, setValues] = useState({ name: "", phone: "", adresse: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setValues({ name: user?.name || "", phone: user?.phone || "", adresse: user?.adresse || "" });
  }, [user?._id, user?.name, user?.phone, user?.adresse]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await API.put(`/users/${user._id}`, values);
      setUser(response.data.data);
      setMessage("Account details saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save account details.");
    } finally { setSaving(false); }
  };

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const inputClass = "mt-1 w-full rounded-lg border border-blueGray-200 bg-white px-3 py-2 text-sm text-blueGray-800 focus:border-blueGray-500 focus:outline-none focus:ring-2 focus:ring-blueGray-200";

  return <section aria-labelledby="account-settings-heading" className="mb-6 rounded-xl border border-blueGray-100 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-blueGray-100 px-6 py-5">
      <div><h2 id="account-settings-heading" className="text-xl font-bold text-blueGray-800">Account details</h2><p className="mt-1 text-sm text-blueGray-500">Manage the information attached to your admin account.</p></div>
      <span className="rounded-full bg-blueGray-100 px-3 py-1 text-xs font-semibold capitalize text-blueGray-600">{user?.role || "Admin"}</span>
    </header>
    <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
      <label className="text-sm font-medium text-blueGray-600">Full name<input name="name" required value={values.name} onChange={update("name")} className={inputClass} /></label>
      <label className="text-sm font-medium text-blueGray-600">Email<input type="email" readOnly value={user?.email || ""} className={`${inputClass} bg-blueGray-50`} /></label>
      <label className="text-sm font-medium text-blueGray-600">Phone<input type="tel" required value={values.phone} onChange={update("phone")} className={inputClass} /></label>
      <label className="text-sm font-medium text-blueGray-600">Address<input value={values.adresse} onChange={update("adresse")} className={inputClass} /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={saving || !user?._id} className="rounded-lg bg-blueGray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blueGray-700 disabled:opacity-50">{saving ? "Saving…" : "Save account"}</button>
        {message && <p role="status" className="text-sm text-blueGray-600">{message}</p>}
      </div>
    </form>
  </section>;
}
