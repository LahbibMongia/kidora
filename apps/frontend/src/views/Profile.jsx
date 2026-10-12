import asset_assets_img_team_3_800x800_jpg from "assets/img/team-3-800x800.jpg";
// Profile.js
import React, { useCallback, useState, useEffect } from "react";
import { useAuth } from "context/AuthContext.jsx";
import { useHistory } from "react-router-dom";
import Navbar from "components/Navbars/AuthNavbar.jsx";
import Footer from "components/Footers/Footer.jsx";
import API from "service/api";
import ReviewForm from "components/ReviewForm.jsx";
import MessageCenter from "components/MessageCenter.jsx";
import NotificationCenter from "components/NotificationCenter.jsx";
import ProfilePhotoUpload from "components/ProfilePhotoUpload.jsx";


// Import your API services
import {
  getParentReservations,
  cancelReservation,
} from "service/restApiReservation.js"

const getStatusStyle = (status) => {
  if (!status) return "bg-blueGray-100 text-blueGray-700";
  const styles = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    finished: "bg-blueGray-100 text-blueGray-700"
  };

  return styles[status.toLowerCase()] || "bg-blueGray-100 text-blueGray-700";
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const history = useHistory();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [family, setFamily] = useState({ members: [], children: [] });
  const [children, setChildren] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [familyMessage, setFamilyMessage] = useState("");
  const [reviewsByReservation, setReviewsByReservation] = useState({});
  const [familyLoading, setFamilyLoading] = useState(true);
  const [childrenSaving, setChildrenSaving] = useState(false);
  const [sitterSearch, setSitterSearch] = useState("");

  const loadFamily = useCallback(async () => {
    if (!user?._id) return;
    try {
      setFamilyLoading(true);
      const response = await API.get("/families/me");
      const household = response.data.data || { members: [], children: [] };
      setFamily(household);
      setChildren(household.children || []);
    } catch (error) {
      setFamilyMessage("Could not load household details.");
    } finally { setFamilyLoading(false); }
  }, [user?._id]);

  useEffect(() => { loadFamily(); }, [loadFamily]);

  const loadReviews = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await API.get(`/reviews/parent/${user._id}`);
      setReviewsByReservation(Object.fromEntries((response.data.data || []).filter((review) => review.reservation).map((review) => [String(review.reservation._id || review.reservation), review])));
    } catch (error) { setReviewsByReservation({}); }
  }, [user?._id]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const inviteParent = async (event) => {
    event.preventDefault();
    try {
      const response = await API.post("/families/invite", { email: inviteEmail });
      setInviteToken(response.data.data.invitationToken);
      setFamilyMessage(`Invitation code created for ${inviteEmail}. Share this code with them.`);
    } catch (error) {
      setFamilyMessage(error.response?.data?.message || "Could not invite this parent.");
    }
  };

  const joinFamily = async (event) => {
    event.preventDefault();
    try {
      await API.post("/families/join", { invitationToken: joinToken });
      setJoinToken("");
      setFamilyMessage("You joined the shared household.");
      await loadFamily();
      await loadReservations(user._id);
    } catch (error) {
      setFamilyMessage(error.response?.data?.message || "Could not join this household.");
    }
  };

  const saveChildren = async () => {
    setChildrenSaving(true);
    try {
      const response = await API.put("/families/children", { children });
      setChildren(response.data.data.children);
      setFamilyMessage("Shared children list saved.");
    } catch (error) {
      setFamilyMessage(error.response?.data?.message || "Could not save children.");
    } finally { setChildrenSaving(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    try {
      const response = await API.put(`/users/${user._id}`, {
        name: values.get("name"), phone: values.get("phone"), adresse: values.get("adresse"),
        numberOfChildren: Number(values.get("numberOfChildren")), specialRequirements: values.get("specialRequirements"),
      });
      setUser(response.data.data);
      setProfileMessage("Profile saved.");
    } catch (error) {
      setProfileMessage(error.response?.data?.message || "Could not save your profile.");
    }
  };

  const loadReservations = useCallback(async (userId) => {
    try {
      setLoading(true);
      const res = await getParentReservations(userId);

      if (Array.isArray(res.data)) {
        setReservations(res.data);
      } else if (res.data && Array.isArray(res.data.reservations)) {
        setReservations(res.data.reservations);
      } else if (res.data && Array.isArray(res.data.data)) {
        setReservations(res.data.data);
      } else if (res.data && typeof res.data === "object") {
        setReservations([res.data]);
      } else {
        setReservations([]);
      }
    } catch (err) {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reservations whenever the authenticated user's ID is available
  useEffect(() => {
    if (user?._id) {
      loadReservations(user._id);
    } else {
      setLoading(false);
    }
  }, [user?._id, loadReservations]);

  const handleCancelReservation = async (id) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      try {
        await cancelReservation(id);
        setReservations((prev) =>
          prev.map((reservation) =>
            (reservation._id === id || reservation.id === id)
              ? { ...reservation, status: "cancelled" }
              : reservation
          )
        );
      } catch (err) {
        alert("Unable to cancel reservation. Please try again later.");
      }
    }
  };

  return (
    <>
      <style>{`
        .hover-scale-102 {
          display: inline-block;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
      <Navbar transparent />
      <div id="root" style={{ minHeight: "100%", backgroundColor: "var(--color-cream-50)" }} className="min-h-screen pb-16 pt-24">
        {/* Header & Navigation */}
        <header className="shadow-sm py-4 px-6 mb-8 mt-0 w-full flex justify-between items-center relative z-10" style={{ borderRadius: "0 0 10px 10px" }}>
          <div className="container mx-auto max-w-4xl flex justify-end items-center gap-12">
            
            {/* Search Bar */}
            <form onSubmit={(event) => { event.preventDefault(); history.push(`/auth/booking${sitterSearch.trim() ? `?search=${encodeURIComponent(sitterSearch.trim())}` : ""}`); }} className="relative w-72 shrink-0">
              <span className="z-10 h-full font-normal absolute text-center text-blueGray-300 bg-transparent rounded text-xs items-center justify-center w-10 flex">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                placeholder="Find a babysitter"
                aria-label="Find a babysitter"
                value={sitterSearch}
                onChange={(event) => setSitterSearch(event.target.value)}
                className="border border-blueGray-200 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 relative bg-white rounded text-xs shadow-sm outline-none focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 w-full pl-10 transition-colors"
                style={{ borderRadius: "10px" }}
              />
            </form>

            {/* Notification & Action Button Container */}
            <div className="flex items-center gap-8">
              <button type="button" aria-label="Go to notifications" onClick={() => document.getElementById("notifications")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="text-blueGray-400 hover:text-blueGray-600 transition-colors w-8 h-8 flex items-center justify-center outline-none focus:outline-none shrink-0 relative">
                <i className="fas fa-bell text-base absolute"></i>
              </button>

              <button 
                onClick={() => history.push("/auth/booking")}
                className="hover-scale-102 bg-blueGray-800 text-white active:bg-blueGray-900 font-bold uppercase text-xs px-6 py-2 shadow hover:shadow-md outline-none focus:outline-none shrink-0" 
                style={{ borderRadius: "8px" }}
              >
                Book a Sitter
              </button>
            </div>

          </div>
        </header>

        <main className="container mx-auto px-4 max-w-4xl flex flex-col gap-8">
          <NotificationCenter id="notifications" />
          
          {/* Main Profile Card (Household Section) */}
          <div className="bg-white shadow-lg p-6 sm:p-8" style={{ borderRadius: "10px" }}>
            <h2 className="text-xl font-bold text-blueGray-800 mb-6 border-b border-blueGray-100 pb-3 pl-4">Household Profile</h2>
            
            <div className="flex flex-col sm:flex-row gap-8 pl-4">
              {/* Profile Photo & Edit Button */}
              <ProfilePhotoUpload user={user} setUser={setUser} className="flex-shrink-0" />

              {/* Account Information */}
              <form onSubmit={saveProfile} className="flex flex-col w-full gap-4 pl-0 sm:pl-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col w-full sm:w-1/2 gap-1">
                    <label className="text-xs font-bold text-blueGray-500 uppercase tracking-wide">Name</label>
                    <input 
                      type="text" 
                      name="name" defaultValue={user?.name || ""} required
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-3 px-4 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                  <div className="flex flex-col w-full sm:w-1/2 gap-1">
                    <label className="text-xs font-bold text-blueGray-500 uppercase tracking-wide">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ""} readOnly
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-3 px-4 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                </div>
                <div className="flex flex-col w-full gap-1">
                  <label className="text-xs font-bold text-blueGray-500 uppercase tracking-wide">Phone</label>
                  <input 
                    type="tel" 
                    name="phone" defaultValue={user?.phone || ""} required
                    className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-3 px-4 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                    style={{ borderRadius: "8px" }}
                  />
                </div>

                <div className="flex flex-col w-full gap-1">
                  <label className="text-xs font-bold text-blueGray-500 uppercase tracking-wide">Address</label>
                  <input 
                    type="text" 
                    name="adresse" defaultValue={user?.adresse || ""}
                    className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-3 px-4 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                    style={{ borderRadius: "8px" }}
                  />
                </div>

                <div className="flex flex-col w-full gap-1">
                  <label className="text-xs font-bold text-blueGray-500 uppercase tracking-wide">Number of children</label>
                  <input type="number" min="0" name="numberOfChildren" defaultValue={user?.numberOfChildren ?? 0} className="border rounded p-3" />
                </div>
                <div className="flex flex-col w-full gap-1">
                  <label className="text-xs font-bold text-blueGray-500 uppercase tracking-wide">Special requirements</label>
                  <textarea name="specialRequirements" defaultValue={user?.specialRequirements || ""} className="border rounded p-3" />
                </div>
                <button type="submit" className="self-start bg-blueGray-800 text-white rounded px-5 py-3">Save profile</button>
                {profileMessage && <p role="status">{profileMessage}</p>}
              </form>
            </div>
          </div>

          {/* Children Summary */}
<div className="bg-white shadow-lg p-6 sm:p-8" style={{ borderRadius: "10px" }}>
  <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-blueGray-100 pb-3">
    <div>
      <h2 className="text-xl font-bold text-blueGray-800">My Children</h2>
      <p className="text-sm text-blueGray-500">Children in your shared household</p>
    </div>
    <button
      type="button"
      disabled={children.length >= 20}
      onClick={() => setChildren((prev) => [...prev, { id: Date.now(), name: "", age: "" }])}
      className="text-sm font-bold text-blueGray-700 border rounded-lg px-3 py-2 hover:bg-blueGray-50 disabled:opacity-50"
    >
      + Add Child
    </button>
  </div>

  {familyLoading ? (
    <p aria-live="polite" className="py-4 text-blueGray-500">Loading your children...</p>
  ) : children.length === 0 ? (
    <p className="rounded-lg bg-blueGray-50 p-4 text-sm text-blueGray-600">
      No children added yet. Add a child to keep household details together.
    </p>
  ) : (
    <div className="space-y-3">
      {children.map((child, index) => (
        <div
          key={child._id || child.id || index}
          className="grid grid-cols-[minmax(0,1fr)_100px_auto] gap-2 rounded-lg border border-blueGray-100 p-3"
        >
          <label className="text-xs font-semibold text-blueGray-500">
            Child {index + 1}
            <input
              aria-label={`Child ${index + 1} name`}
              value={child.name || ""}
              onChange={(event) => {
                const val = event.target.value;
                setChildren((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, name: val } : item))
                );
              }}
              placeholder="Child name"
              className="mt-1 w-full border rounded p-2 text-sm text-blueGray-800"
            />
          </label>

          <label className="text-xs font-semibold text-blueGray-500">
            Age
            <input
              aria-label={`Child ${index + 1} age`}
              type="number"
              min="0"
              max="18"
              value={child.age ?? ""}
              onChange={(event) => {
                const val = event.target.value;
                setChildren((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, age: val } : item))
                );
              }}
              placeholder="Age"
              className="mt-1 w-full border rounded p-2 text-sm text-blueGray-800"
            />
          </label>

          <button
            type="button"
            onClick={() => setChildren((prev) => prev.filter((_, i) => i !== index))}
            aria-label={`Remove child ${index + 1}`}
            className="self-end text-sm text-red-700 underline"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  <button
    type="button"
    disabled={childrenSaving || familyLoading}
    onClick={saveChildren}
    className="mt-4 bg-blueGray-800 text-white rounded-lg px-4 py-2 disabled:opacity-50"
  >
    {childrenSaving ? "Saving..." : "Save children"}
  </button>
</div>

          <section className="bg-white shadow-lg p-6 sm:p-8 rounded-lg" aria-labelledby="family-heading">
            <h2 id="family-heading" className="text-xl font-bold mb-3">Shared household</h2>
            <ul className="mb-4">{family.members?.map((member, index) => <li key={member?._id || index}>{member?.name || "Household member"}{member?.email ? ` (${member.email})` : ""}</li>)}</ul>
            <form onSubmit={inviteParent} className="flex gap-2 mb-3">
              <input type="email" aria-label="Other parent email" placeholder="Other parent's email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="border rounded p-2" />
              <button type="submit" className="border rounded px-3">Create invite code</button>
            </form>
            {inviteToken && <p>Invitation code: <output aria-label="Invitation code">{inviteToken}</output></p>}
            <form onSubmit={joinFamily} className="flex gap-2">
              <input aria-label="Invitation code" placeholder="Invitation code" required value={joinToken} onChange={(event) => setJoinToken(event.target.value)} className="border rounded p-2" />
              <button type="submit" className="border rounded px-3">Join household</button>
            </form>
            {familyMessage && <p role="status" className="mt-2">{familyMessage}</p>}
          </section>

          {/* Upcoming Reservations */}
          <div className="bg-white shadow-lg p-6 sm:p-8" style={{ borderRadius: "10px" }}>
            <h2 className="text-xl font-bold text-blueGray-800 mb-6 border-b border-blueGray-100 pb-3 pl-4">Upcoming Reservations</h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-blueGray-200 border-t-blueGray-800 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-blueGray-500">Loading your reservations...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <i className="far fa-calendar-times text-4xl text-blueGray-300 mb-4"></i>
                <p className="text-sm font-semibold text-blueGray-500">No reservations found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reservations.map((res) => {
                  const reservationId = res._id || res.id;
                  const isCancellable = res.status?.toLowerCase() !== "cancelled" && res.status?.toLowerCase() !== "finished";

                  return (
                    <div 
                      key={reservationId} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white gap-4" 
                      style={{ borderRadius: "10px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blueGray-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                          <img 
                            alt="..." 
                            src={res.babysitter?.image && res.babysitter.image !== "default.jpg" ? res.babysitter.image : res.imgSrc || asset_assets_img_team_3_800x800_jpg}
                            className="shadow-md rounded-full h-full w-full object-cover border-none"
                          />
                        </div>
                        <div className="pl-4">
                          <h4 className="font-bold text-blueGray-800 mb-1">
                          {res.sitterName || res.sitter?.name || res.babysitter?.name || "Babysitter"}
                          </h4>
                          <p className="text-sm font-semibold text-blueGray-500">
                            <i className="far fa-calendar-alt mr-2"></i>
                            {res.dateTime || `${new Date(res.date).toLocaleDateString()} • ${res.startTime} - ${res.endTime}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-auto w-full sm:w-auto">
                        <span
                          className={`${getStatusStyle(res.status)} text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide self-start sm:self-end`}
                        >
                          {res.status}
                        </span>
                        
                        <div className="flex gap-4 self-start sm:self-end mt-1">
                          <a 
                            href="#details" 
                            onClick={e => e.preventDefault()} 
                            className="hover-scale-102 text-xs font-bold text-blueGray-500 hover:text-blueGray-800 uppercase inline-block"
                          >
                            View Details
                          </a>

                          {isCancellable && (
                            <button 
                              onClick={() => handleCancelReservation(reservationId)} 
                              className="hover-scale-102 text-xs font-bold text-red-500 hover:text-red-700 uppercase"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                      {["confirmed", "completed"].includes(res.status) && (
                        <ReviewForm reservationId={reservationId} existingReview={reviewsByReservation[String(reservationId)]} onSubmitted={loadReviews} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <MessageCenter />

        </main>
      </div>
      <Footer />
    </>
  );
}
