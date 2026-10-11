import React, { useEffect, useState } from "react";
import API from "service/api";

const metrics = [
  { key: "users", title: "Total accounts", icon: "fas fa-users", tone: "bg-orange-500" },
  { key: "parents", title: "Parents", icon: "fas fa-user-friends", tone: "bg-pink-500" },
  { key: "babysitters", title: "Babysitters", icon: "fas fa-user-check", tone: "bg-emerald-500" },
  { key: "reservations", title: "Reservations", icon: "far fa-calendar-alt", tone: "bg-lightBlue-500" },
];

export default function HeaderStats() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([API.get("/users"), API.get("/reservations")]).then(([usersResponse, reservationsResponse]) => {
      const users = usersResponse.data.data || [];
      setCounts({
        users: users.length,
        parents: users.filter((user) => user.role === "parent").length,
        babysitters: users.filter((user) => user.role === "babysitter").length,
        reservations: (reservationsResponse.data.data || []).length,
      });
    }).catch((failure) => setError(failure.response?.data?.message || "Could not load dashboard totals."));
  }, []);

  return <div className="relative bg-lightBlue-500 pb-12 pt-12 md:pt-32">
    <div className="mx-auto w-full px-4 md:px-10">
      {error && <p role="alert" className="mb-4 rounded bg-white/95 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap" aria-label="Platform totals">
        {metrics.map((metric) => <div key={metric.key} className="w-full px-4 sm:w-6/12 xl:w-3/12">
          <article className="mb-4 flex min-h-28 items-center justify-between rounded-xl bg-white p-5 shadow-lg">
            <div><h2 className="text-xs font-bold uppercase tracking-wide text-blueGray-500">{metric.title}</h2><p className="mt-2 text-2xl font-bold text-blueGray-800" aria-live="polite">{counts ? counts[metric.key].toLocaleString() : "—"}</p></div>
            <span aria-hidden="true" className={`${metric.tone} flex h-12 w-12 items-center justify-center rounded-full text-white`}><i className={metric.icon}></i></span>
          </article>
        </div>)}
      </div>
      <p className="px-4 text-sm text-white/80">Live totals from accounts and reservations.</p>
    </div>
  </div>;
}
