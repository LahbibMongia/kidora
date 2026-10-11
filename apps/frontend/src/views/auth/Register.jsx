import asset_assets_img_google_svg from "assets/img/google.svg";
import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { register as apiRegister } from "service/authService.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const initialRole =
    location.state?.role === "babysitter"
      ? "babysitter"
      : "parent";

  const [formData, setFormData] = useState({
    role: initialRole,

    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",

    numberOfChildren: "",
    specialRequirements: "",

    hourlyRate: "",
    experienceYears: "",
    hasBackgroundCheck: false,

    agree: false,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.address
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!formData.agree) {
      setError("You must agree to the Privacy Policy to sign up.");
      return;
    }

    // Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.");
      return;
    }

    try {
      setLoading(true);
      await apiRegister(formData);
      setSuccess("Account created successfully! Redirecting to login...");
      
      // Clean form fields
      setFormData({
        role: formData.role,

        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",

        numberOfChildren: "",
        specialRequirements: "",

        hourlyRate: "",
        experienceYears: "",
        hasBackgroundCheck: false,

        agree: false,
      });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        history.push("/auth/login");
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.message || err.response.data.error || "Unable to create account");
      } else if (err.message === "Network Error") {
        setError("Backend server is currently unavailable.");
      } else {
        setError("Failed to create account. Email may already be in use.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 h-full">
        <div className="flex content-center items-center justify-center h-full">
          <div className="w-full lg:w-4/12 px-1 -mt-20">
            <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
              
              <div className="flex-auto px-4 lg:px-10 py-10 pt-0 -mt-16">
                <div className="text-blueGray-400 text-center mb-3 font-bold">
                  <small>Sign up as</small>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-xs font-semibold text-center">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-xs font-semibold text-center">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* --- ROLE TOGGLE --- */}
                  <div className="flex mb-6 rounded-lg overflow-hidden border">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: "parent",
                        })
                      }
                      className={`w-1/2 py-3 font-semibold transition-all ${
                        formData.role === "parent"
                          ? "bg-lightBlue-500 text-white"
                          : "bg-white text-blueGray-600"
                      }`}
                    >
                      Parent
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: "babysitter",
                        })
                      }
                      className={`w-1/2 py-3 font-semibold transition-all ${
                        formData.role === "babysitter"
                          ? "bg-lightBlue-500 text-white"
                          : "bg-white text-blueGray-600"
                      }`}
                    >
                      Babysitter
                    </button>
                  </div>

                  {/* --- COMMON FIELDS (Name) --- */}
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Name"
                      required
                    />
                  </div>

                  {/* --- COMMON FIELDS (Email) --- */}
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      name="email"
                      onChange={handleChange}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Email"
                      required
                    />
                  </div>

                  {/* --- COMMON FIELDS (Phone) --- */}
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                  {/* --- COMMON FIELDS (Address) --- */}
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}  
                      onChange={handleChange}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Address"
                      required
                    />
                  </div>
                  {/* --- COMMON FIELDS (Password) --- */}
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Password
                    </label>
                    <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full pr-12"
                      placeholder="Password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                                    </div>

                  {/* --- CONDITIONAL FIELDS (Parent) --- */}
                  {formData.role === "parent" && (
                    <div className="p-3 bg-lightBlue-100 rounded border border-lightBlue-200 mb-4 transition-all duration-150">
                      <h4 className="text-xs font-bold text-lightBlue-700 uppercase mb-3">
                        Parent Profile Details
                      </h4>
                      <div className="relative w-full mb-3">
                        <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Number of Children
                        </label>
                        <input
                          type="number"
                          name="numberOfChildren"
                          min="1"
                          value={formData.numberOfChildren}
                          onChange={handleChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div className="relative w-full mb-3">
                        <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Special Requirements
                        </label>
                        <textarea
                          name="specialRequirements"
                          value={formData.specialRequirements}
                          onChange={handleChange}
                          rows="3"
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="Any allergies, routines, or special medical needs..."
                        />
                      </div>
                    </div>
                  )}

                  {/* --- CONDITIONAL FIELDS (Babysitter) --- */}
                  {formData.role === "babysitter" && (
                    <div className="p-3 bg-pink-100 rounded border border-pink-200 mb-4 transition-all duration-150">
                      <h4 className="text-xs font-bold text-pink-700 uppercase mb-3">
                        Babysitter Profile Details
                      </h4>
                      <div className="relative w-full mb-3">
                        <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Hourly Rate ($ / hour)
                        </label>
                        <input
                          type="number"
                          name="hourlyRate"
                          min="0"
                          value={formData.hourlyRate}
                          onChange={handleChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="e.g. 15"
                        />
                      </div>
                      <div className="relative w-full mb-3">
                        <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="experienceYears"
                          min="0"
                          value={formData.experienceYears}
                          onChange={handleChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="e.g. 3"
                        />
                      </div>
                      <div className="relative w-full mb-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="hasBackgroundCheck"
                            checked={formData.hasBackgroundCheck}
                            onChange={handleChange}
                            className="form-checkbox border-0 rounded text-pink-500 w-5 h-5 ease-linear transition-all duration-150"
                          />
                          <span className="ml-2 text-xs font-semibold text-blueGray-600 uppercase">
                            I have a certified background check
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* --- PRIVACY AGREEMENT --- */}
                  <div className="mt-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        id="customCheckLogin"
                        type="checkbox"
                        checked={formData.agree}
                        name="agree"
                        onChange={handleChange}
                        className="form-checkbox border-0 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150"
                      />
                      <span className="ml-2 text-sm font-semibold text-blueGray-600">
                        I agree with the{" "}
                        <a
                          href="#pablo"
                          className="text-lightBlue-500"
                          onClick={(e) => e.preventDefault()}
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  {/* --- SUBMIT BUTTON --- */}
                  <div className="text-center mt-6">
                    <button
                      className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="flex flex-wrap mt-6 relative">
              <div className="w-1/2">
                <Link to="/auth/forget" className="text-blueGray-900">
                  <small>Forgot password?</small>
                </Link>
              </div>
              <div className="w-1/2 text-right">
                <Link to="/auth/login" className="text-blueGray-900">
                  <small>Login</small>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
