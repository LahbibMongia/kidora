import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import Navbar from "components/Navbars/AuthNavbar.jsx";
import Footer from "components/Footers/Footer.jsx";
import { useAuth } from "context/AuthContext.jsx";
import API from "service/api";
import ProfilePhotoUpload from "components/ProfilePhotoUpload.jsx";

export default function EditProfileBs() {
  const { user, setUser } = useAuth();
  const history = useHistory();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!user?._id) {
      setMessage("User profile not found. Please log in again.");
      return;
    }
    setSaving(true);
    const values = new FormData(event.currentTarget);
    try {
      const response = await API.put(`/users/${user._id}`, {
        name: values.get("name"),
        phone: values.get("phone"),
        adresse: values.get("adresse"),
        hourlyRate: Number(values.get("hourlyRate")),
        experienceYears: Number(values.get("experienceYears")),
        availability: values.get("availability"),
        certif: values.get("certif"),
        experience: values.get("experience"),
      });
      setUser(response.data.data);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar transparent />

      {/* Coral header band behind Navbar */}
      <div
        className="relative bg-lightBlue-800 pb-32 pt-24"
        style={{ backgroundColor: "#EC774F" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="w-full lg:w-8/12 px-4 mb-4 lg:mb-0">
              <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-white text-blueGray-800 inline-block mb-2 shadow-sm">
                Babysitter Account
              </span>
              <h1 className="text-2xl font-bold text-white mb-2">
                Edit Babysitter Profile
              </h1>
              <p className="text-sm text-white opacity-80">
                Update your caregiver bio, rates, schedule and qualifications
              </p>
            </div>
            <div className="w-full lg:w-4/12 px-4 flex md:justify-end">
              <button
                type="button"
                onClick={() => history.push("/profile-bs")}
                className="inline-flex items-center justify-center font-bold rounded-lg shadow outline-none focus:outline-none focus:ring transition-all duration-150 ease-linear hover:shadow-lg text-xs px-4 py-2 bg-white text-blueGray-600 border border-blueGray-300"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main page content */}
      <div className="bg-blueGray-100 min-h-screen pb-16">
        <main className="container mx-auto px-4 max-w-4xl -mt-8">
          <form onSubmit={saveProfile}>
            <div className="flex flex-wrap">
              {/* Left Column: Photo Upload and Caregiver Overview */}
              <div className="w-full lg:w-4/12 px-3 mb-6">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <h2 className="text-xs font-bold text-blueGray-800 uppercase tracking-wide mb-4">
                    Profile Photo
                  </h2>
                  <div className="flex justify-center mb-4">
                    <ProfilePhotoUpload user={user} setUser={setUser} />
                  </div>
                  <div className="text-center mt-2">
                    <h3 className="text-base font-bold text-blueGray-800">
                      {user?.name || "Caregiver"}
                    </h3>
                    <p className="text-xs text-blueGray-500 mb-3">
                      {user?.email || ""}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blueGray-50 text-blueGray-800 border border-blueGray-200">
                      <i className="fas fa-check-circle text-xs text-emerald-700 mr-2"></i>
                      Verified Babysitter
                    </div>
                  </div>

                  <div className="border-t border-blueGray-100 pt-4 mt-6 text-left">
                    <div className="bg-blueGray-50 rounded-lg p-4 border border-blueGray-200">
                      <div className="flex items-center mb-2">
                        <i className="fas fa-lightbulb text-lightBlue-500 mr-2 text-sm"></i>
                        <span className="text-xs font-bold text-blueGray-800">Pro Tip</span>
                      </div>
                      <p className="text-xs text-blueGray-600 leading-relaxed">
                        Parents look for complete bios, transparent hourly rates, and listed certifications when booking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Profile Form */}
              <div className="w-full lg:w-8/12 px-3 mb-6">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                  {/* Status / Feedback Alert */}
                  {message && (
                    <div
                      role={message.includes("saved") ? "status" : "alert"}
                      className={`p-4 rounded-lg mb-6 flex items-center shadow-sm ${
                        message.includes("saved")
                          ? "bg-emerald-400 text-blueGray-800"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      <i
                        className={`fas ${
                          message.includes("saved")
                            ? "fa-check-circle"
                            : "fa-exclamation-circle"
                        } mr-3 text-lg`}
                      ></i>
                      <span className="text-sm font-bold">{message}</span>
                    </div>
                  )}

                  {/* Section 1: Personal Information */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4 border-b border-blueGray-100 pb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blueGray-50 text-lightBlue-500 mr-3 text-sm font-bold">
                        <i className="fas fa-user"></i>
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-blueGray-800">
                          Personal Information
                        </h2>
                        <p className="text-xs text-blueGray-500">
                          Your public caregiver identity and contact details
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap">
                      {/* Name */}
                      <div className="w-full md:w-6/12 px-2 mb-4">
                        <label
                          htmlFor="bs-name"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="bs-name"
                          type="text"
                          name="name"
                          required
                          defaultValue={user?.name || ""}
                          placeholder="e.g. Jane Doe"
                          className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                        />
                      </div>

                      {/* Email (Read Only) */}
                      <div className="w-full md:w-6/12 px-2 mb-4">
                        <label
                          htmlFor="bs-email"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Email Address{" "}
                          <span className="text-xs text-blueGray-400 font-normal lowercase">
                            (read-only)
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            id="bs-email"
                            type="email"
                            readOnly
                            value={user?.email || ""}
                            className="border border-blueGray-200 px-4 py-3 text-blueGray-500 bg-blueGray-50 rounded-lg text-sm shadow-sm outline-none w-full"
                          />
                          <span className="absolute right-0 top-0 mt-3 mr-3 text-blueGray-400 text-xs">
                            <i className="fas fa-lock"></i>
                          </span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="w-full md:w-6/12 px-2 mb-4">
                        <label
                          htmlFor="bs-phone"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="bs-phone"
                          type="text"
                          name="phone"
                          required
                          defaultValue={user?.phone || ""}
                          placeholder="e.g. +1 555-0123"
                          className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                        />
                      </div>

                      {/* Location / Address */}
                      <div className="w-full md:w-6/12 px-2 mb-4">
                        <label
                          htmlFor="bs-adresse"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Location / City
                        </label>
                        <input
                          id="bs-adresse"
                          type="text"
                          name="adresse"
                          defaultValue={user?.adresse || ""}
                          placeholder="e.g. Brooklyn, NY"
                          className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Rates & Experience */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4 border-b border-blueGray-100 pb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blueGray-50 text-lightBlue-500 mr-3 text-sm font-bold">
                        <i className="fas fa-clock"></i>
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-blueGray-800">
                          Rates & Experience
                        </h2>
                        <p className="text-xs text-blueGray-500">
                          Set your compensation and years in childcare
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap">
                      {/* Hourly Rate */}
                      <div className="w-full md:w-6/12 px-2 mb-4">
                        <label
                          htmlFor="bs-hourlyRate"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Hourly Rate ($/hr) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-0 top-0 mt-3 ml-3 text-blueGray-400 text-sm font-bold">
                            $
                          </span>
                          <input
                            id="bs-hourlyRate"
                            type="number"
                            min="0"
                            step="0.01"
                            name="hourlyRate"
                            required
                            defaultValue={user?.hourlyRate ?? 15}
                            placeholder="15.00"
                            className="border border-blueGray-200 pl-10 pr-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                          />
                        </div>
                      </div>

                      {/* Years of Experience */}
                      <div className="w-full md:w-6/12 px-2 mb-4">
                        <label
                          htmlFor="bs-experienceYears"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Years of Experience
                        </label>
                        <div className="relative">
                          <input
                            id="bs-experienceYears"
                            type="number"
                            min="0"
                            name="experienceYears"
                            defaultValue={user?.experienceYears ?? 0}
                            placeholder="0"
                            className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                          />
                          <span className="absolute right-0 top-0 mt-3 mr-3 text-blueGray-400 text-xs font-bold uppercase">
                            Yrs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Availability & Certifications */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4 border-b border-blueGray-100 pb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blueGray-50 text-lightBlue-500 mr-3 text-sm font-bold">
                        <i className="fas fa-calendar-check"></i>
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-blueGray-800">
                          Availability & Qualifications
                        </h2>
                        <p className="text-xs text-blueGray-500">
                          Your schedule options and certified credentials
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap">
                      {/* Availability */}
                      <div className="w-full px-2 mb-4">
                        <label
                          htmlFor="bs-availability"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Availability
                        </label>
                        <input
                          id="bs-availability"
                          type="text"
                          name="availability"
                          defaultValue={user?.availability || ""}
                          placeholder="e.g. Weekdays, afternoons, weekend evenings"
                          className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                        />
                      </div>

                      {/* Certifications */}
                      <div className="w-full px-2 mb-4">
                        <label
                          htmlFor="bs-certif"
                          className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                        >
                          Certifications & Training
                        </label>
                        <input
                          id="bs-certif"
                          type="text"
                          name="certif"
                          defaultValue={user?.certif || ""}
                          placeholder="e.g. CPR Certified, Pediatric First Aid, Driver's License"
                          className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Caregiver Bio / Experience */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4 border-b border-blueGray-100 pb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blueGray-50 text-lightBlue-500 mr-3 text-sm font-bold">
                        <i className="fas fa-comment-dots"></i>
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-blueGray-800">
                          About Me & Childcare Approach
                        </h2>
                        <p className="text-xs text-blueGray-500">
                          Introduce yourself to families and explain your care philosophy
                        </p>
                      </div>
                    </div>

                    <div className="w-full px-2 mb-4">
                      <label
                        htmlFor="bs-experience"
                        className="block text-xs font-bold text-blueGray-700 uppercase mb-2"
                      >
                        Caregiver Bio & Experience
                      </label>
                      <textarea
                        id="bs-experience"
                        name="experience"
                        rows="4"
                        defaultValue={user?.experience || ""}
                        placeholder="Tell parents about yourself: your childcare philosophy, favorite activities with children, routine management, and comfort with different age groups..."
                        className="border border-blueGray-200 px-4 py-3 placeholder-blueGray-300 text-blueGray-800 bg-white rounded-lg text-sm shadow-sm outline-none focus:outline-none focus:ring-1 focus:border-blueGray-800 w-full transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-blueGray-100 pt-6 mt-6 flex flex-wrap items-center justify-end">
                    <button
                      type="button"
                      onClick={() => history.push("/profile-bs")}
                      className="inline-flex items-center justify-center font-bold rounded-lg shadow outline-none focus:outline-none focus:ring transition-all duration-150 ease-linear hover:shadow-lg text-sm px-6 py-3 bg-white text-blueGray-600 border border-blueGray-300 mr-3 mb-2"
                    >
                      <i className="fas fa-times mr-2 text-xs"></i>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`inline-flex items-center justify-center font-bold rounded-lg shadow outline-none focus:outline-none focus:ring transition-all duration-150 ease-linear hover:shadow-lg text-sm px-6 py-3 bg-emerald-400 text-blueGray-800 mb-2 ${
                        saving ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <i className="fas fa-check mr-2 text-xs"></i>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      <Footer />
    </>
  );
}
