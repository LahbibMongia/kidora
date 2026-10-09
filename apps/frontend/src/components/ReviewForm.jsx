import React, { useEffect, useState } from "react";
import API from "service/api";

export default function ReviewForm({ reservationId, existingReview, onSubmitted }) {
  const [rating, setRating] = useState(String(existingReview?.rating || 5));
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!existingReview);

  useEffect(() => {
    setRating(String(existingReview?.rating || 5));
    setComment(existingReview?.comment || "");
    setEditing(!existingReview);
  }, [existingReview?._id, existingReview?.rating, existingReview?.comment]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { reservation: reservationId, rating: Number(rating), comment };
      const response = existingReview?._id
        ? await API.put(`/reviews/${existingReview._id}`, payload)
        : await API.post("/reviews", payload);
      setMessage(existingReview ? "Review updated." : "Review published.");
      setEditing(false);
      onSubmitted?.(response.data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save your review.");
    } finally { setSaving(false); }
  };

  if (existingReview && !editing) return <div className="mt-3 border-t pt-3">
    <p className="text-sm font-semibold">Your review · {existingReview.rating}/5</p>
    {existingReview.comment && <p className="mt-1 text-sm text-blueGray-600">{existingReview.comment}</p>}
    <button type="button" onClick={() => { setMessage(""); setEditing(true); }} className="mt-2 text-sm font-semibold text-blue-700 underline">Edit rating or comment</button>
    {message && <p role="status">{message}</p>}
  </div>;

  return <form onSubmit={submit} className="mt-3 border-t pt-3 space-y-2">
    <label className="block text-sm font-medium">Rating
      <select aria-label="Rating" value={rating} onChange={(event) => setRating(event.target.value)} className="ml-2 border rounded p-2">
        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
      </select>
    </label>
    <textarea aria-label="Review comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Share your experience" className="w-full border rounded p-2" />
    <div className="flex gap-2">
      <button type="submit" disabled={saving} className="bg-blueGray-800 text-white rounded px-3 py-2">{saving ? "Saving..." : existingReview ? "Save review" : "Publish review"}</button>
      {existingReview && <button type="button" disabled={saving} onClick={() => { setEditing(false); setMessage(""); }} className="border rounded px-3 py-2">Cancel</button>}
    </div>
    {message && <p role="status">{message}</p>}
  </form>;
}
