import asset_assets_img_team_2_800x800_jpg from "assets/img/team-2-800x800.jpg";
import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "context/AuthContext.jsx";
import { getBabysitterReservations, confirmReservation, rejectReservation } from "../../service/restApiReservation";
import API from "service/api";
import ReviewForm from "components/ReviewForm.jsx";
import MessageCenter from "components/MessageCenter.jsx";
import NotificationCenter from "components/NotificationCenter.jsx";
import Navbar from "components/Navbars/AuthNavbar";
import Footer from "components/Footers/Footer";

export default function Profile() {
  const history = useHistory();
  const { currentUser } = useAuth(); // Read currentUser from AuthContext
  const [reservations, setReservations] = useState([]);
  const [reservationError, setReservationError] = useState("");
  const [sitterReviews, setSitterReviews] = useState([]);
  const [myReviewsByReservation, setMyReviewsByReservation] = useState({});

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

  const loadMyReviews = useCallback(async () => {
    if (!currentUser?._id) return;
    try {
      const response = await API.get(`/reviews/parent/${currentUser._id}`);
      setMyReviewsByReservation(Object.fromEntries((response.data.data || []).filter((review) => review.reservation).map((review) => [String(review.reservation._id || review.reservation), review])));
    } catch (error) { setMyReviewsByReservation({}); }
  }, [currentUser?._id]);
  useEffect(() => { loadMyReviews(); }, [loadMyReviews]);

  const updateReservation = async (id, action) => {
    try {
      if (action === "confirm") await confirmReservation(id);
      else await rejectReservation(id);
      await loadReservations();
    } catch (error) {
      setReservationError(error.response?.data?.message || "Could not update this request.");
    }
  };

  const babysitter = currentUser || {};
  const completedBookings = reservations.filter((booking) => booking.status === "completed").length;
  const averageRating = sitterReviews.length
    ? (sitterReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / sitterReviews.length).toFixed(1)
    : "—";

  return (
    <>
      <Navbar transparent />
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
                        alt={currentUser?.name ? `${currentUser.name} profile` : "Babysitter profile"}
                        src={currentUser?.image && currentUser.image !== "default.jpg" ? currentUser.image : asset_assets_img_team_2_800x800_jpg}
                        className="shadow-xl rounded-full h-auto align-middle border-none absolute -top-16 -ml-20 lg:-ml-16 max-w-150-px"
                      />
                    </div>
                  </div>
                  <div className="w-full lg:w-4/12 px-4 lg:order-1">
                      <div data-testid="sitter-profile-stats" className="flex justify-center py-4 lg:pt-4 pt-8">
                      <div className="mr-4 p-3 text-center">
                        <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                          {completedBookings}
                        </span>
                        <span className="text-sm text-blueGray-400">Bookings Completed</span>
                      </div>
                      <div className="mr-4 p-3 text-center">
                        <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                          {Number(currentUser?.experienceYears) || 0}
                        </span>
                        <span className="text-sm text-blueGray-400">Years Experience</span>
                      </div>
                      <div className="p-3 text-center">
                        <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                          {averageRating}
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
                    {currentUser?.adresse || "Location not provided"}
                  </div>
                  <div className="mb-2 text-blueGray-600 mt-10">
                    <i className="fas fa-briefcase mr-2 text-lg text-blueGray-400"></i>
                    {currentUser?.certif || "No certifications listed"}
                  </div>
                  <div className="mb-2 text-blueGray-600">
                    <i className="fas fa-user-check mr-2 text-lg text-blueGray-400"></i>
                    {currentUser?.hasBackgroundCheck ? "Background check completed" : "Background check not listed"}
                  </div>
                </div>

                <div className="mt-10 py-10 border-t border-blueGray-200 text-center">
                  <div className="flex flex-wrap justify-center">
                    <div className="w-full lg:w-9/12 px-6">
                      <p className="mb-4 text-lg leading-relaxed text-blueGray-700">
                        {currentUser?.experience || "This babysitter has not added a profile introduction yet."}
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
      <section className="container mx-auto px-4 max-w-5xl pt-8"><NotificationCenter /></section>
      <section aria-labelledby="booking-plan-heading" className="container mx-auto px-4 max-w-5xl pt-8 mb-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 id="booking-plan-heading" className="text-2xl font-bold text-blueGray-800 mb-4">Booking plan</h2>
          {reservationError && <p role="alert" className="text-red-600 mb-3">{reservationError}</p>}
          {reservations.length === 0 ? <p className="text-blueGray-500">No bookings in your plan yet.</p> : <div className="space-y-3">
            {reservations.map((booking) => <article key={booking._id} className="border rounded-lg p-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-semibold">{booking.parent?.name || "Parent"}</p>
                <p>{new Date(booking.date).toLocaleDateString()} · {booking.startTime || booking.timeSlot} {booking.endTime ? `- ${booking.endTime}` : ""}</p>
                {booking.notes && <p className="text-sm text-blueGray-600">{booking.notes}</p>}
                {["confirmed", "completed"].includes(booking.status) && <ReviewForm reservationId={booking._id} existingReview={myReviewsByReservation[String(booking._id)]} onSubmitted={() => { loadReviews(); loadMyReviews(); }} />}
              </div>
              <div className="flex items-center gap-3">
                <span className="capitalize">{booking.status}</span>
                {booking.status === "pending" && <>
                  <button type="button" onClick={() => updateReservation(booking._id, "confirm")} className="bg-green-600 text-white rounded px-3 py-2">Accept</button>
                  <button type="button" onClick={() => updateReservation(booking._id, "reject")} className="bg-red-600 text-white rounded px-3 py-2">Decline</button>
                </>}
              </div>
            </article>)}
          </div>}
          <div className="mt-8 border-t pt-5">
            <h3 className="text-lg font-bold mb-3">Public recommendations</h3>
            {sitterReviews.length === 0 ? <p className="text-blueGray-500">No recommendations yet.</p> : sitterReviews.map((review) => <article key={review._id} className="border-b py-3">
              <p className="font-semibold">{review.reviewer?.name || review.parent?.name || "Parent"} · {review.rating}/5</p>
              <p>{review.comment}</p>
            </article>)}
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 max-w-5xl mb-12"><MessageCenter /></section>
      <Footer />
    </>
  );
}
