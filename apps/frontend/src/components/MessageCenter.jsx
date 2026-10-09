import React, { useCallback, useEffect, useState } from "react";
import API from "service/api";
import { useAuth } from "context/AuthContext.jsx";

export default function MessageCenter() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [peerId, setPeerId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const loadContacts = useCallback(async () => {
    try {
      const response = await API.get("/messages/contacts");
      setContacts(response.data.data || []);
    } catch (failure) { setError("Could not load message contacts."); }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!peerId) return;
    try {
      const response = await API.get(`/messages/${peerId}`);
      setMessages(response.data.data.messages || []);
      setError("");
    } catch (failure) { setError(failure.response?.data?.message || "Could not load this conversation."); }
  }, [peerId]);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadMessages(); }, [loadMessages]);

  const send = async (event) => {
    event.preventDefault();
    if (!peerId || !text.trim()) return;
    try {
      await API.post("/messages", { recipient: peerId, text });
      setText("");
      await loadMessages();
    } catch (failure) { setError(failure.response?.data?.message || "Could not send message."); }
  };

  return <section aria-labelledby="messages-heading" className="mt-8 bg-white rounded-lg shadow p-6">
    <h2 id="messages-heading" className="text-xl font-bold mb-3">Messages</h2>
    {contacts.length === 0 ? <p className="text-blueGray-500">People you have booked with will appear here.</p> : <div className="flex flex-wrap gap-2 mb-4">
      {contacts.map((contact) => <button key={contact._id} type="button" onClick={() => setPeerId(contact._id)} aria-pressed={peerId === contact._id} className={`rounded px-3 py-2 ${peerId === contact._id ? "bg-blueGray-800 text-white" : "border"}`}>
        Message {contact.name}
      </button>)}
    </div>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {peerId && <>
      <div aria-live="polite" className="border rounded p-3 min-h-20 max-h-64 overflow-auto space-y-2">
        {messages.length === 0 ? <p className="text-blueGray-500">Start the conversation.</p> : messages.map((message) => <p key={message._id} className={String(message.sender?._id) === String(user?._id) ? "text-right" : "text-left"}>
          <span className="inline-block bg-blueGray-100 rounded px-3 py-2">{message.text}</span>
        </p>)}
      </div>
      <form onSubmit={send} className="flex gap-2 mt-3">
        <input aria-label="Write a message" value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} required className="flex-1 border rounded p-2" />
        <button type="submit" className="bg-blueGray-800 text-white rounded px-4">Send</button>
      </form>
    </>}
  </section>;
}
