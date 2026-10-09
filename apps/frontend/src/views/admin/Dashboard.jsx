import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "service/api";

const statuses = ["pending", "confirmed", "completed", "cancelled"];

export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/reservations");
      setReservations(response.data.data || []);
      setError("");
    } catch (failure) {
      setError(failure.response?.data?.message || "Could not load reservations.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadReservations(); }, [loadReservations]);

  const counts = useMemo(() => Object.fromEntries(statuses.map((status) => [status, reservations.filter((booking) => booking.status === status).length])), [reservations]);
  const recent = useMemo(() => reservations
    .filter((booking) => filter === "all" || booking.status === filter)
    .sort((left, right) => new Date(right.createdAt || right.date) - new Date(left.createdAt || left.date))
    .slice(0, 10), [filter, reservations]);

  return <main className="space-y-6 px-4 pb-8">
    <section aria-labelledby="reservation-overview-heading" className="rounded-xl border border-blueGray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 id="reservation-overview-heading" className="text-2xl font-bold text-blueGray-800">Reservation overview</h1><p className="mt-1 text-sm text-blueGray-500">Current booking activity across the platform.</p></div>
        <button type="button" disabled={loading} onClick={loadReservations} className="rounded-lg border border-blueGray-200 px-4 py-2 text-sm font-semibold text-blueGray-700 hover:bg-blueGray-50 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statuses.map((status) => <div key={status} className="rounded-lg bg-blueGray-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blueGray-500">{status}</p>
          <p className="mt-1 text-2xl font-bold text-blueGray-800">{loading ? "—" : counts[status]}</p>
        </div>)}
      </div>
    </section>

    <section aria-labelledby="recent-bookings-heading" className="overflow-hidden rounded-xl border border-blueGray-100 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-blueGray-100 p-6">
        <div><h2 id="recent-bookings-heading" className="text-lg font-bold text-blueGray-800">Recent bookings</h2><p className="mt-1 text-sm text-blueGray-500">Parent, sitter, date, and current status.</p></div>
        <label className="text-sm font-medium text-blueGray-600">Filter by status <select aria-label="Filter bookings by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 rounded-lg border border-blueGray-200 bg-white p-2">
          <option value="all">All bookings</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select></label>
      </header>
      {loading ? <p role="status" className="p-6 text-sm text-blueGray-500">Loading bookings…</p> : recent.length === 0 ? <p className="p-6 text-sm text-blueGray-500">{reservations.length ? "No bookings match this filter." : "No bookings have been created yet."}</p> : <div className="divide-y divide-blueGray-100">
        {recent.map((booking) => <article key={booking._id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h3 className="font-semibold text-blueGray-800">{booking.parent?.name || "Parent account"} <span className="font-normal text-blueGray-400">with</span> {booking.babysitter?.name || "Babysitter account"}</h3><p className="mt-1 text-sm text-blueGray-500">{new Date(booking.date).toLocaleDateString()} · {booking.startTime || booking.timeSlot}{booking.endTime ? `–${booking.endTime}` : ""}</p></div>
          <span className="rounded-full bg-blueGray-100 px-3 py-1 text-xs font-semibold capitalize text-blueGray-700">{booking.status}</span>
        </article>)}
      </div>}
    </section>
  </main>;
}
