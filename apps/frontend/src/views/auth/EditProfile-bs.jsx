import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import Navbar from "components/Navbars/AuthNavbar.jsx";
import Footer from "components/Footers/Footer.jsx";
import { useAuth } from "context/AuthContext.jsx";
import API from "service/api";

export default function EditProfileBs() {
  const { user, setUser } = useAuth();
  const history = useHistory();
  const [message, setMessage] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    try {
      const response = await API.put(`/users/${user._id}`, {
        name: values.get("name"), phone: values.get("phone"), adresse: values.get("adresse"),
        hourlyRate: Number(values.get("hourlyRate")), experienceYears: Number(values.get("experienceYears")),
        availability: values.get("availability"), certif: values.get("certif"), experience: values.get("experience"),
      });
      setUser(response.data.data);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save your profile.");
    }
  };

  return (
    <>
      <Navbar transparent />
      <div className="bg-blueGray-50 min-h-screen pb-16 pt-24">
        <main className="container mx-auto px-4 max-w-3xl">
          <form onSubmit={saveProfile} className="bg-white shadow-lg rounded-lg p-6 sm:p-8 mt-8 space-y-5">
            <h1 className="text-2xl font-bold text-blueGray-800">Edit Babysitter Profile</h1>
            <label className="block">Name<input name="name" required defaultValue={user?.name || ""} className="mt-1 w-full border rounded p-3" /></label>
            <label className="block">Email<input type="email" readOnly value={user?.email || ""} className="mt-1 w-full border rounded p-3 bg-gray-100" /></label>
            <label className="block">Phone<input name="phone" required defaultValue={user?.phone || ""} className="mt-1 w-full border rounded p-3" /></label>
            <label className="block">Location<input name="adresse" defaultValue={user?.adresse || ""} className="mt-1 w-full border rounded p-3" /></label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">Hourly rate<input type="number" min="0" step="0.01" name="hourlyRate" required defaultValue={user?.hourlyRate ?? 15} className="mt-1 w-full border rounded p-3" /></label>
              <label className="block">Years of experience<input type="number" min="0" name="experienceYears" defaultValue={user?.experienceYears ?? 0} className="mt-1 w-full border rounded p-3" /></label>
            </div>
            <label className="block">Availability<input name="availability" defaultValue={user?.availability || ""} placeholder="Weekdays, evenings..." className="mt-1 w-full border rounded p-3" /></label>
            <label className="block">Certifications<input name="certif" defaultValue={user?.certif || ""} className="mt-1 w-full border rounded p-3" /></label>
            <label className="block">About me<textarea name="experience" rows="4" defaultValue={user?.experience || ""} className="mt-1 w-full border rounded p-3" /></label>
            <div className="flex gap-3 items-center">
              <button type="submit" className="bg-blueGray-800 text-white rounded px-5 py-3">Save Changes</button>
              <button type="button" onClick={() => history.push("/profile-bs")} className="border rounded px-5 py-3">Cancel</button>
              {message && <p role="status">{message}</p>}
            </div>
          </form>
        </main>
      </div>
      <Footer />
    </>
  );
}
