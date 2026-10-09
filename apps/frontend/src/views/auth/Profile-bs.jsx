import asset_assets_img_team_2_800x800_jpg from "assets/img/team-2-800x800.jpg";
import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "context/AuthContext.jsx";
import { createReservation } from "../../service/restApiReservation";
import { getBabysitterReservations, confirmReservation, rejectReservation } from "../../service/restApiReservation";
import API from "service/api";
import ReviewForm from "components/ReviewForm.jsx";
import MessageCenter from "components/MessageCenter.jsx";
import Navbar from "components/Navbars/AuthNavbar";
import Footer from "components/Footers/Footer";

export default function Profile() {
  const history = useHistory();
  const { currentUser } = useAuth(); // Read currentUser from AuthContext
  const [reservations, setReservations] = useState([]);
  const [reservationError, setReservationError] = useState("");
  const [sitterReviews, setSitterReviews] = useState([]);

  const loadReservations = useCallback(async () => {
    if (!currentUser?._id) return;
    try {
      const response = await getBabysitterReservations(currentUser._id);
      setReservations(response.data.data || []);
      setReservationError("");
    } catch (error) {
      setReservationError("Could not load your booking plan.");
    }
  }, [currentUser?._id]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const loadReviews = useCallback(async () => {
    if (!currentUser?._id) return;
    try {
      const response = await API.get(`/reviews/babysitter/${currentUser._id}`);
      setSitterReviews(response.data.data || []);
    } catch (error) { setSitterReviews([]); }
  }, [currentUser?._id]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  const updateReservation = async (id, action) => {
    try {
      if (action === "confirm") await confirmReservation(id);
      else await rejectReservation(id);
      await loadReservations();
    } catch (error) {
      setReservationError(error.response?.data?.message || "Could not update this request.");
    }
  };

  // Mocking babysitter profile details for this view. 
  // In a real application, you would fetch this dynamic babysitter object from your API or pass it via route state.
  const babysitter = {
    _id: "sitter_mayssa_123", // Matches target dynamic babysitter ID
    name: "Mayssa Hmidi",
  };

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationData, setReservationData] = useState({
    date: "",
    timeSlot: "",
    notes: "",
    children: [],
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmitReservation = async () => {
    // 1. Guard check: Ensure we have an active parent logged in
    if (!currentUser || !currentUser._id) {
      setErrorMessage("You must be logged in as a parent to book a babysitter.");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      // 2. Build exact payload structure relying solely on Auth-derived currentUser._id
      const payload = {
        parent: currentUser._id, // Send the validated database ID of the logged-in parent
        babysitter: babysitter._id, // Selected target babysitter ID
        date: new Date(reservationData.date),
        timeSlot: reservationData.timeSlot,
        notes: reservationData.notes,
      };

      // 3. Make API call using the decoupled service
      await createReservation(payload);

      setSuccessMessage("Request sent! The babysitter will respond soon.");
      setShowReservationModal(false);
      
      // Reset form state
      setReservationData({
        date: "",
        timeSlot: "",
        notes: "",
        children: [],
      });
    } catch (error) {
      setErrorMessage(error?.message || "Failed to submit reservation. Please try again.");
    }
  };

  return (
    <>
      <Navbar transparent />
      
      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 relative animate-fadeIn">
            {/* Close button */}
            <button
              onClick={() => {
                setShowReservationModal(false);
                setErrorMessage("");
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center"> Book {babysitter.name}</h3>
              <p className="text-sm text-gray-500 text-center">
                Select a date and describe your needs. The babysitter will respond within 24h.
              </p>

              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                {/* Date */}
                <input
                  type="date"
                  value={reservationData.date}
                  className="w-full border border-gray-200 focus:border-lightBlue-500 focus:ring-1 focus:ring-lightBlue-500 rounded-lg p-3 outline-none transition"
                  onChange={(e) =>
                    setReservationData({ ...reservationData, date: e.target.value })
                  }
                />

                {/* Time Slot */}
                <input
                  type="text"
                  placeholder="Time (e.g. 18:00 - 22:00)"
                  value={reservationData.timeSlot}
                  className="w-full border border-gray-200 focus:border-lightBlue-500 focus:ring-1 focus:ring-lightBlue-500 rounded-lg p-3 outline-none transition"
                  onChange={(e) =>
                    setReservationData({ ...reservationData, timeSlot: e.target.value })
                  }
                />

                {/* Notes */}
                <textarea
                  placeholder="Describe your needs..."
                  value={reservationData.notes}
                  className="w-full border border-gray-200 focus:border-lightBlue-500 focus:ring-1 focus:ring-lightBlue-500 rounded-lg p-3 outline-none transition"
                  onChange={(e) =>
                    setReservationData({ ...reservationData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                className="flex-1 bg-red-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition"
                onClick={() => {
                  setShowReservationModal(false);
                  setErrorMessage("");
                }}
              >
                Cancel
              </button>

              <button
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg shadow-md hover:shadow-lg transition"
                onClick={handleSubmitReservation}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="booking-plan-heading" className="container mx-auto px-4 max-w-5xl pt-24">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 id="booking-plan-heading" className="text-2xl font-bold text-blueGray-800 mb-4">Booking plan</h2>
          {reservationError && <p role="alert" className="text-red-600 mb-3">{reservationError}</p>}
          {reservations.length === 0 ? <p className="text-blueGray-500">No bookings in your plan yet.</p> : (
            <div className="space-y-3">
              {reservations.map((booking) => (
                <article key={booking._id} className="border rounded-lg p-4 flex flex-wrap justify-between gap-3 items-center">
                  <div>
                    <p className="font-semibold">{booking.parent?.name || "Parent"}</p>
                    <p>{new Date(booking.date).toLocaleDateString()} · {booking.startTime || booking.timeSlot} {booking.endTime ? `- ${booking.endTime}` : ""}</p>
                    {booking.notes && <p className="text-sm text-blueGray-600">{booking.notes}</p>}
                    {["confirmed", "completed"].includes(booking.status) && <ReviewForm reservationId={booking._id} onSubmitted={loadReviews} />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="capitalize">{booking.status}</span>
                    {booking.status === "pending" && <>
                      <button type="button" onClick={() => updateReservation(booking._id, "confirm")} className="bg-green-600 text-white rounded px-3 py-2">Accept</button>
                      <button type="button" onClick={() => updateReservation(booking._id, "reject")} className="bg-red-600 text-white rounded px-3 py-2">Decline</button>
                    </>}
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="mt-8 border-t pt-5">
            <h3 className="text-lg font-bold mb-3">Public recommendations</h3>
            {sitterReviews.length === 0 ? <p className="text-blueGray-500">No recommendations yet.</p> : sitterReviews.map((review) => (
              <article key={review._id} className="border-b py-3">
                <p className="font-semibold">{review.reviewer?.name || review.parent?.name || "Parent"} · {review.rating}/5</p>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <main className="profile-page">
        <section className="relative block h-500-px">
          <div
            className="absolute top-0 w-full h-full bg-center bg-cover"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1497366247376-ebfdbb2b4968?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80')",
            }}
          >
            <span id="blackOverlay" className="w-full h-full absolute opacity-20 bg-black"></span>
          </div>
          <div
            className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-70-px"
            style={{ transform: "translateZ(0)" }}
          >
            <svg
              className="absolute bottom-0 overflow-visible w-full h-70-px"
              preserveAspectRatio="none"
              viewBox="0 0 2560 100"
              x="0"
              y="0"
            >
              <polygon className="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon>
            </svg>
          </div>
        </section>

        <section className="relative py-16 bg-blueGray-200">
          <div className="container mx-auto px-4">
            <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-lg -mt-64">
              <div className="px-6">
                <div className="flex flex-wrap justify-center">
                  <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                    <div className="relative">
                      <img
                        alt="..."
                        src={asset_assets_img_team_2_800x800_jpg}
                        className="shadow-xl rounded-full h-auto align-middle border-none absolute -top-16 -ml-20 lg:-ml-16 max-w-150-px"
                      />
                    </div>
                  </div>
                  <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-end">
                    <div className="py-6 px-3 mt-32 sm:mt-0">
                      <button
                        className="bg-lightBlue-500 active:bg-lightBlue-600 uppercase text-white font-bold hover:shadow-md shadow text-xs px-4 py-2 rounded outline-none"
                        type="button"
                        onClick={() => setShowReservationModal(true)}
                      >
                        + Book this babysitter
                      </button>
                      {successMessage && (
                        <p className="text-green-600 mt-2 font-semibold">{successMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="w-full lg:w-4/12 px-4 lg:order-1">
                    <div className="flex justify-center py-4 lg:pt-4 pt-8">
                      <div className="mr-4 p-3 text-center">
                        <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                          22
                        </span>
                        <span className="text-sm text-blueGray-400">Bookings Completed</span>
                      </div>
                      <div className="mr-4 p-3 text-center">
                        <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                          6
                        </span>
                        <span className="text-sm text-blueGray-400">Years Experience</span>
                      </div>
                      <div className="p-3 text-center">
                        <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                          4.9
                        </span>
                        <span className="text-sm text-blueGray-400">Rating</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-12">
                  <h3 className="text-4xl font-semibold leading-normal mb-2 text-blueGray-700">
                    {currentUser?.name || babysitter.name}
                  </h3>
                  <div className="text-sm leading-normal mt-0 mb-2 text-blueGray-400 font-bold">
                    <i className="fas fa-map-marker-alt mr-2 text-lg text-blueGray-400"></i>
                    Tunis
                  </div>
                  <div className="mb-2 text-blueGray-600 mt-10">
                    <i className="fas fa-briefcase mr-2 text-lg text-blueGray-400"></i>
                    Certified Early Childhood Educator | CPR & First Aid Certified
                  </div>
                  <div className="mb-2 text-blueGray-600">
                    <i className="fas fa-university mr-2 text-lg text-blueGray-400"></i>
                    B.A. in Child Psychology, State University
                  </div>
                </div>

                <div className="mt-10 py-10 border-t border-blueGray-200 text-center">
                  <div className="flex flex-wrap justify-center">
                    <div className="w-full lg:w-9/12 px-6">
                      <p className="mb-4 text-lg leading-relaxed text-blueGray-700">
                        With over 6 years of professional childcare experience, I specialize in creating a safe, engaging, and educational environment for children ages 2-10. My approach combines structured learning with creative play, ensuring your little ones are not just supervised, but truly inspired.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-6 px-3 mt-8 sm:mt-0 flex justify-center">
                  <button
                    className="active:bg-blueGray-900 uppercase text-blueGray-900 font-bold hover:shadow-lg shadow px-8 py-1 outline-none focus:outline-none transition-all duration-150 border-2 border-blueGray-900"
                    style={{ borderRadius: "10px" }}
                    type="button"
                    onClick={() => history.push("/edit-profile-bs")}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className="container mx-auto px-4 max-w-5xl -mt-8 mb-12"><MessageCenter /></section>
      <Footer />
    </>
  );
}
