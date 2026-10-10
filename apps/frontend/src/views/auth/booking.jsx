import asset_assets_img_team_3_800x800_jpg from "assets/img/team-3-800x800.jpg";
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "context/AuthContext.jsx";
import { useHistory, useLocation } from "react-router-dom";
import API from "service/api"; // Centralized Axios instance

import Navbar from "components/Navbars/AuthNavbar.jsx";
import Footer from "components/Footers/Footer.jsx";

const timeToMinutes = (value) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export default function Booking() {
  const { user } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get("search") || "";

  // State
  const [sitters, setSitters] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const requestVersion = useRef(0);

  // Form State
  const [bookingForm, setBookingForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
    repeatWeeks: 1,
  });

  // Load Babysitters
  const fetchSitters = async (query = "") => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      setSearchError("");
      const res = await API.get(`/users/babysitters${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      if (version !== requestVersion.current) return;
      setSitters(res.data.data || []);
      const recommendationResponse = await API.get(`/recommendations/top${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      if (version !== requestVersion.current) return;
      setRecommended(recommendationResponse.data.data || []);
    } catch (err) {
      if (version === requestVersion.current) {
        setRecommended([]);
        setSearchError(err.response?.data?.message || "Could not load babysitters. Please try again.");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSitters(searchTerm.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
  };

  // Calculate estimated price dynamically
  const calculateTotalCost = () => {
    if (!bookingForm.startTime || !bookingForm.endTime || !selectedSitter) return 0;
    const start = timeToMinutes(bookingForm.startTime);
    const end = timeToMinutes(bookingForm.endTime);
    if (start === null || end === null || end <= start) return 0;
    const duration = (end - start) / 60;
    const rate = selectedSitter.hourlyRate ?? 0;
    return (duration * rate).toFixed(2);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    if (!user?._id) {
      setBookingError("Please log in as a parent to create a reservation.");
      return;
    }

    const start = timeToMinutes(bookingForm.startTime);
    const end = timeToMinutes(bookingForm.endTime);
    if (start === null || end === null) {
      setBookingError("Enter a valid start and end time.");
      return;
    }
    if (end <= start) {
      setBookingError("End time must be later than start time.");
      return;
    }
    if (end - start > 12 * 60) {
      setBookingError("A booking cannot be longer than 12 hours.");
      return;
    }

    const payload = {
      babysitter: selectedSitter._id,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      notes: bookingForm.notes,
    };

    let created = 0;
    try {
      setSubmitting(true);
      const dates = Array.from({ length: Number(bookingForm.repeatWeeks) || 1 }, (_, index) => {
        const occurrence = new Date(`${bookingForm.date}T00:00:00`);
        occurrence.setDate(occurrence.getDate() + index * 7);
        return `${occurrence.getFullYear()}-${String(occurrence.getMonth() + 1).padStart(2, "0")}-${String(occurrence.getDate()).padStart(2, "0")}`;
      });
      for (const date of dates) {
        await API.post("/reservations", { ...payload, date });
        created += 1;
      }
      setBookingError("");
      setSelectedSitter(null); // Close modal
      history.push("/profile");
    } catch (err) {
      const reason = err.response?.data?.message || "Failed to complete booking.";
      setBookingError(created ? `${created} booking request${created === 1 ? " was" : "s were"} sent before an error: ${reason}` : reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar transparent />
      <div className="bg-blueGray-100 min-h-screen pb-16 pt-24">
        <main className="container mx-auto px-4 max-w-6xl">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center my-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blueGray-800">Find a Babysitter</h1>
              <p className="text-sm text-blueGray-500">Discover trusted & verified sitters near you</p>
            </div>
            
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by name or city..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-blueGray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <i className="fas fa-search absolute left-3 top-3 text-blueGray-400"></i>
            </div>
          </div>

          {searchError && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{searchError}</p>}
          {recommended.length > 0 && <section aria-labelledby="recommended-heading" className="mb-8">
            <h2 id="recommended-heading" className="text-xl font-bold text-blueGray-800 mb-3">Recommended for you</h2>
            <p className="text-sm text-blueGray-500 mb-4">Matches profile text with your search, then considers reviews, completed bookings, availability, and experience.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommended.map((sitter, index) => <article key={sitter._id} className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-400">
                <p className="text-xs uppercase font-bold text-orange-600">#{index + 1} match · {sitter.recommendationScore}%{sitter.textMatchScore > 0 ? ` · ${sitter.textMatchScore}% text match` : ""}</p>
                <h3 className="font-bold text-lg mt-1">{sitter.name}</h3>
                <p className="font-semibold">{sitter.hourlyRate != null ? `$${sitter.hourlyRate}/hr` : "Rate not listed"}</p>
                <p className="text-sm">{sitter.reviewCount ? `${sitter.rating}/5 · ${sitter.reviewCount} recommendations` : "No reviews yet"}</p>
                <p className="text-sm text-blueGray-600">{sitter.completedBookings} completed bookings · {sitter.availability || "Availability not listed"}</p>
                <button type="button" onClick={() => setSelectedSitter(sitter)} className="mt-3 bg-orange-500 text-white rounded px-4 py-2">Book {sitter.name}</button>
              </article>)}
            </div>
          </section>}

          {/* Sitters Grid */}
          {loading ? (
            <div className="text-center py-20 text-blueGray-500 font-semibold">
              Loading available babysitters...
            </div>
          ) : sitters.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow">
              <i className="fas fa-user-slash text-4xl text-blueGray-300 mb-3"></i>
              <p className="text-blueGray-600 font-medium">No babysitters found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sitters.map((sitter) => (
                <div
                  key={sitter._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 flex flex-col justify-between border border-blueGray-100"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={sitter.image && sitter.image !== "default.jpg" ? sitter.image : asset_assets_img_team_3_800x800_jpg}
                        alt={sitter.name}
                        className="w-16 h-16 rounded-full object-cover shadow"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-blueGray-800">{sitter.name}</h3>
                        <p className="text-xs text-blueGray-500">
                          <i className="fas fa-map-marker-alt mr-1 text-orange-500"></i>
                          {sitter.adresse || "Location not specified"}
                        </p>
                        <div className="text-xs text-amber-500 font-bold mt-1">
                          <i className="fas fa-star mr-1"></i>
                          {sitter.reviewCount ? `${sitter.rating} · ${sitter.reviewCount} recommendation${sitter.reviewCount === 1 ? "" : "s"}` : "New sitter"}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-blueGray-600 line-clamp-3 mb-4">
                      {sitter.experience || "No introduction added yet."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-blueGray-100 flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold text-blueGray-800">{sitter.hourlyRate != null ? `$${sitter.hourlyRate}` : "Rate not listed"}</span>
                      {sitter.hourlyRate != null && <span className="text-xs text-blueGray-400">/hr</span>}
                    </div>

                    <button
                      onClick={() => setSelectedSitter(sitter)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg shadow transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Booking Modal */}
          {selectedSitter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                  <h3 className="text-lg font-bold text-blueGray-800">Book {selectedSitter.name}</h3>
                  <button
                    onClick={() => setSelectedSitter(null)}
                    className="text-blueGray-400 hover:text-blueGray-700 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {bookingError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{bookingError}</p>}
                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-blueGray-600 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm text-blueGray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blueGray-600 mb-1" htmlFor="repeatWeeks">
                      Repeat weekly
                    </label>
                    <select
                      id="repeatWeeks"
                      value={bookingForm.repeatWeeks}
                      onChange={(e) => setBookingForm({ ...bookingForm, repeatWeeks: Number(e.target.value) })}
                      className="w-full border rounded-lg p-2.5 text-sm text-blueGray-700"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                        <option key={count} value={count}>{count === 1 ? "One booking" : `${count} weekly bookings`}</option>
                      ))}
                    </select>
                    <p className="text-xs text-blueGray-500 mt-1">Each date is sent as a separate request. Conflicting dates are reported by the sitter.</p>
                  </div>

                  {/* Time Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-blueGray-600 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full border rounded-lg p-2.5 text-sm text-blueGray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-blueGray-600 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        required
                        min={bookingForm.startTime || undefined}
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full border rounded-lg p-2.5 text-sm text-blueGray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-blueGray-600 mb-1">
                      Notes for Babysitter (Optional)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Specify allergies, bedtime routines, etc."
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-sm text-blueGray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    ></textarea>
                  </div>

                  {/* Dynamic Cost Summary */}
                  <div className="bg-blueGray-50 p-4 rounded-lg flex justify-between items-center border border-blueGray-200">
                    <div>
                      <p className="text-xs text-blueGray-500 font-semibold">Estimated Total</p>
                      <p className="text-xs text-blueGray-400">Rate: {selectedSitter.hourlyRate != null ? `$${selectedSitter.hourlyRate}/hr` : "not listed"}</p>
                    </div>
                    <span className="text-xl font-extrabold text-blueGray-800">
                      ${calculateTotalCost()}
                    </span>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSitter(null)}
                      className="w-1/2 py-3 text-xs font-bold uppercase text-blueGray-500 hover:text-blueGray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase py-3 rounded-lg shadow transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Sending..." : "Confirm Request"}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </main>
      </div>
      <Footer />
    </>
  );
}
