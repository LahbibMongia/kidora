import React, { useState } from "react";
import API from "service/api";

export default function ReviewForm({ reservationId, onSubmitted }) {
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await API.post("/reviews", { reservation: reservationId, rating: Number(rating), comment });
      setMessage("Review published.");
      onSubmitted?.();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not publish your review.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={submit} className="mt-3 border-t pt-3 space-y-2">
    <label className="block text-sm">Rating
      <select aria-label="Rating" value={rating} onChange={(event) => setRating(event.target.value)} className="ml-2 border rounded p-1">
        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
      </select>
    </label>
    <textarea aria-label="Review comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Share your experience" className="w-full border rounded p-2" />
    <button type="submit" disabled={saving} className="bg-blueGray-800 text-white rounded px-3 py-2">{saving ? "Publishing..." : "Publish review"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
