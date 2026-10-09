import asset_assets_img_team_2_800x800_jpg from "assets/img/team-2-800x800.jpg";
import React from "react";
import Navbar from "components/Navbars/AuthNavbar.jsx";
import Footer from "components/Footers/Footer.jsx";
import { useAuth } from "context/AuthContext.jsx";

export default function EditProfileBs() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : "";
  const lastName = user?.name ? user.name.split(' ').slice(1).join(' ') : "";
  return (
    <>
      <Navbar transparent />
      <div className="bg-blueGray-50 min-h-screen pb-16 pt-24">
        <main className="container mx-auto px-4 max-w-4xl flex flex-col gap-10">
          
          <div className="bg-white shadow-lg p-6 sm:p-8 mt-12" style={{ borderRadius: "10px" }}>
            <div className="flex justify-between items-center mb-6 border-b border-blueGray-100 pb-3 pl-4 pr-4">
              <h2 className="text-2xl font-bold text-blueGray-800">Edit Babysitter Profile</h2>
            </div>
            
            <form className="pl-0 sm:pl-4 pr-0 sm:pr-4">
              {/* Profile Photo Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
                <div className="relative">
                  <img
                    alt="Profile Avatar"
                    src={asset_assets_img_team_2_800x800_jpg}
                    className="shadow-md h-24 w-24 object-cover border-none mx-auto rounded-full"
                    />
                    </div>
                    <div className="flex flex-col gap-5 justify-center pt-2 text-center sm:text-left px-4">
                    <span className="text-sm font-semibold text-blueGray-700">Profile Photo</span>
                    <div className="flex gap-6 justify-center sm:justify-start mt-2">
                        <button type="button" className="bg-blueGray-800 text-white active:bg-blueGray-900 font-bold uppercase text-sm px-8 py-3 shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 m-2" style={{ borderRadius: "8px" }}>
                        Change Photo
                        </button>
                        <button type="button" className="bg-white text-blueGray-500 border border-blueGray-200 active:bg-blueGray-100 font-bold uppercase text-sm px-8 py-3 hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 m-2" style={{ borderRadius: "8px" }}>
                        Remove
                        </button>
                    </div>
                    </div>
                </div>

                 <h3 className="text-sm font-bold text-blueGray-400 uppercase tracking-widest mb-6 mt-10 border-b border-blueGray-50 pb-3 pl-4">Personal Information</h3>
              <div className="flex flex-col gap-8 px-4">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col w-full sm:w-1/2 gap-5">
                    <label className="text-xs font-bold text-blueGray-500 tracking-wide">First Name</label>
                    <input 
                      type="text" 
                      defaultValue={firstName} 
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                  <div className="flex flex-col w-full sm:w-1/2 gap-5">
                    <label className="text-xs font-bold text-blueGray-500 tracking-wide">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue={lastName} 
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                </div>
 
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col w-full sm:w-1/2 gap-5">
                    <label className="text-xs font-bold text-blueGray-500 tracking-wide">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ""} 
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                  <div className="flex flex-col w-full sm:w-1/2 gap-5">
                    <label className="text-xs font-bold text-blueGray-500 tracking-wide">Phone Number</label>
                    <input 
                      type="tel" 
                      defaultValue={user?.tel || ""} 
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col w-full gap-5">
                  <label className="text-xs font-bold text-blueGray-500 tracking-wide">Location (City)</label>
                  <input 
                    type="text" 
                    defaultValue={user?.adresse || ""} 
                    className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                    style={{ borderRadius: "8px" }}
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-blueGray-400 uppercase tracking-widest mb-6 mt-12 border-b border-blueGray-50 pb-3 pl-4">Professional Details</h3>
              <div className="flex flex-col gap-8 px-4">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col w-full sm:w-1/2 gap-5">
                    <label className="text-xs font-bold text-blueGray-500 tracking-wide">Professional Title</label>
                    <input 
                      type="text" 
                      defaultValue="Certified Early Childhood Educator" 
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                  <div className="flex flex-col w-full sm:w-1/2 gap-5">
                    <label className="text-xs font-bold text-blueGray-500 tracking-wide">Years of Experience</label>
                    <input 
                      type="number" 
                      defaultValue="6" 
                      className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col w-full gap-5">
                  <label className="text-xs font-bold text-blueGray-500 tracking-wide">Education & Certifications</label>
                  <input 
                    type="text" 
                    defaultValue="B.A. in Child Psychology, State University | CPR certified" 
                    className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                    style={{ borderRadius: "8px" }}
                  />
                </div>

                <div className="flex flex-col w-full gap-5">
                  <label className="text-xs font-bold text-blueGray-500 tracking-wide">About Me (Bio)</label>
                  <textarea 
                    rows="5"
                    defaultValue="With over 6 years of professional childcare experience, I specialize in creating a safe, engaging, and educational environment for children ages 2-10. My approach combines structured learning with creative play, ensuring your little ones are not just supervised, but truly inspired."
                    className="appearance-none block w-full bg-white text-blueGray-800 border border-blueGray-200 py-4 px-6 text-sm focus:outline-none focus:border-blueGray-800 focus:ring-1 focus:ring-blueGray-800 shadow-sm transition-colors" 
                    style={{ borderRadius: "8px" }}
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-6 mt-12 pt-8 border-t border-blueGray-100 pr-2">
                <button 
                  type="button" 
                  className="bg-white text-blueGray-600 border border-blueGray-200 active:bg-blueGray-100 font-bold uppercase text-sm px-10 py-4 shadow-sm hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 m-2"
                  style={{ borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blueGray-800 text-white active:bg-blueGray-900 font-bold uppercase text-sm px-12 py-4 shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 m-2"
                  style={{ borderRadius: "8px" }}
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>

        </main>
      </div>
      <Footer />
    </>
  );
}