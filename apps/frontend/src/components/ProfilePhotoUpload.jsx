import React, { useRef, useState } from "react";
import API from "service/api";
import fallbackAvatar from "assets/img/team-2-800x800.jpg";

function photoUrl(image) {
  if (!image || image === "default.jpg") return fallbackAvatar;
  if (/^https?:\/\//i.test(image)) return image;
  const backend = API.defaults.baseURL || "/api";
  const origin = backend.startsWith("http") ? backend.replace(/\/api\/?$/, "") : "";
  return `${origin}${image.startsWith("/") ? image : `/images/${image}`}`;
}

export default function ProfilePhotoUpload({ user, setUser, className = "" }) {
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const upload = await API.post("/users/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const response = await API.put(`/users/${user._id}`, { image: upload.data.file.path });
      setUser(response.data.data);
      setMessage("Profile photo updated.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update your photo.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  return <div className={`flex flex-col items-center gap-2 ${className}`}>
    <img src={photoUrl(user?.image)} alt={`${user?.name || "Your"} profile`} className="h-24 w-24 rounded-full border border-blueGray-200 object-cover shadow-sm" />
    <button type="button" disabled={saving || !user?._id} onClick={() => inputRef.current?.click()} className="text-sm font-semibold text-blue-700 underline disabled:opacity-50">
      {saving ? "Uploading photo…" : "Change photo"}
    </button>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadPhoto} className="sr-only" aria-label="Choose profile photo" />
    {message && <p role={message.includes("updated") ? "status" : "alert"} className="max-w-48 text-center text-xs text-blueGray-600">{message}</p>}
  </div>;
}
