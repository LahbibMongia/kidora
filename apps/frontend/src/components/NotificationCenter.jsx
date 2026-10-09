import React, { useCallback, useEffect, useState } from "react";
import API from "service/api";
import { useAuth } from "context/AuthContext.jsx";

export default function NotificationCenter({ id = "notifications-heading" }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await API.get(`/notifications/user/${user._id}`);
      setNotifications(response.data.data || []);
      setError("");
    } catch (failure) { setError("Could not load notifications."); }
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}`, { read: true });
      setNotifications((items) => items.map((item) => item._id === id ? { ...item, read: true } : item));
    } catch (failure) { setError("Could not update this notification."); }
  };

  const unread = notifications.filter((item) => !item.read).length;
  return <section id={id === "notifications-heading" ? undefined : id} aria-labelledby="notifications-heading" className="bg-white rounded-lg shadow p-5 mb-6">
    <div className="flex justify-between items-center gap-3">
      <h2 id="notifications-heading" className="text-xl font-bold">Notifications <span aria-label={`${unread} unread`}>({unread} unread)</span></h2>
      <button type="button" onClick={load} className="border rounded px-3 py-2">Refresh</button>
    </div>
    {error && <p role="alert" className="text-red-600 mt-2">{error}</p>}
    {notifications.length === 0 ? <p className="mt-3 text-blueGray-500">No notifications yet.</p> : <ul className="mt-3 space-y-2">
      {notifications.slice(0, 30).map((item) => <li key={item._id} className={`flex justify-between gap-3 border rounded p-3 ${item.read ? "bg-white" : "bg-blueGray-50"}`}>
        <div><p>{item.message}</p><p className="text-xs text-blueGray-500">{new Date(item.createdAt).toLocaleString()}</p></div>
        {!item.read && <button type="button" onClick={() => markRead(item._id)} className="text-sm underline shrink-0">Mark read</button>}
      </li>)}
    </ul>}
  </section>;
}
