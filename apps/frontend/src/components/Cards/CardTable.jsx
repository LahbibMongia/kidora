import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import fallbackAvatar from "assets/img/team-2-800x800.jpg";

// components

import { getAllUsers, deleteUser, addUser, updateUser } from "../../service/restApiUser";
export default function CardTable({ color }) {
  //js
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const emptyUser = { name: "", email: "", password: "", role: "parent", adresse: "", phone: "", hourlyRate: "", experienceYears: "" };
  const [newUserData, setNewUserData] = useState(emptyUser);
  const [editingUser, setEditingUser] = useState(null);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewUserData((current) => ({ ...current, [name]: value }));
    }

    const getUsers = useCallback(async () => {
    try {
      const res = await getAllUsers(); //tjib list of users from back (response)
      setUsers(res.data?.data || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not load users");
      setUsers([]);
    }
  }, []);


  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      getUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not delete user");
    }
  };

  const handleAddUser = async () => {
    try {
      await addUser(newUserData);
      setNewUserData(emptyUser);
      setErrorMessage("");
      getUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not add user");
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    try {
      await updateUser(editingUser._id, editingUser);
      setEditingUser(null);
      setStatusMessage("User details saved.");
      setErrorMessage("");
      await getUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not update user");
    }
  };
  useEffect(() => { //run page load automatically once when component render instead of creating get all user button
    getUsers();
  }, [getUsers]);
  
  return (
    <>
      <div
        className={
          "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
          (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
        }
      >
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h3
                className={
                  "font-semibold text-lg " +
                  (color === "light" ? "text-blueGray-700" : "text-white")
                }
              >
                List of users
              </h3>
            </div>
          </div>
        </div>
        {errorMessage && <p role="alert" className="px-6 pb-3 text-sm text-red-600">{errorMessage}</p>}
        {statusMessage && <p role="status" className="px-6 pb-3 text-sm text-emerald-700">{statusMessage}</p>}
        <div className="block w-full overflow-x-auto">
          {/* Projects table */}
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th
                  className={
                    "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                    (color === "light"
                      ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                      : "bg-white  text-lightBlue-300 border-lightBlue-700")
                  }
                >
                  User Name
                </th>
                <th
                  className={
                    "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                    (color === "light"
                      ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                      : "bg-white  text-lightBlue-300 border-lightBlue-700")
                  }
                >
                  Email
                </th>
                <th
                  className={
                    "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                    (color === "light"
                      ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                      : "bg-white  text-lightBlue-300 border-lightBlue-700")
                  }
                >
                  Role
                </th>
                <th
                  className={
                    "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                    (color === "light"
                      ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                      : "bg-white text-lightBlue-300 border-lightBlue-700")
                  }
                >
                  Created At
                </th>
                <th
                  className={
                    "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                    (color === "light"
                      ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                      : "bg-white text-lightBlue-300 bold border-lightBlue-700")
                  }
                >
                  Actions
                </th>
                <th
                  className={
                    "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                    (color === "light"
                      ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                      : "bg-white text-lightBlue-300 border-lightBlue-700")
                  }
                ></th>
              </tr>
            </thead>
            <tbody>
               {users && users.length > 0 ? (
                  users.map((user, index) => (
                <tr key={index}>
                  <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left flex items-center">
                    <img
                      src={user.image && user.image !== "default.jpg" ? user.image : fallbackAvatar}
                      className="h-12 w-12 bg-white rounded-full border"
                    alt={`${user.name} profile`}
                  ></img>{" "}
                  <span
                    className={
                      "ml-3 font-bold " +
                      (color === "light" ? "text-blueGray-600" : "text-white")
                    }
                  >
                    {user.name}
                  </span>
                </th>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {user.email}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                 {user.role}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                 {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  <button onClick={() => setEditingUser({ ...user })} className="bg-lightBlue-500 text-white active:bg-lightBlue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(user._id)} className="bg-red-500 text-white active:bg-red-700 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button">
                    Delete
                  </button>
                </td>
              </tr>
              )) ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No users found
                  </td>
                </tr>
              )
              }
            </tbody>
          </table>
        </div>
      </div>
      {editingUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
        <form onSubmit={handleUpdateUser} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="edit-user-heading">
          <div><h2 id="edit-user-heading" className="text-xl font-bold text-blueGray-800">Edit user</h2><p className="mt-1 text-sm text-blueGray-500">Update account details for {editingUser.email}.</p></div>
          <label className="block text-sm font-medium">Name<input required value={editingUser.name || ""} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="block text-sm font-medium">Phone<input required value={editingUser.phone || ""} onChange={(event) => setEditingUser({ ...editingUser, phone: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="block text-sm font-medium">Address<input value={editingUser.adresse || ""} onChange={(event) => setEditingUser({ ...editingUser, adresse: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          {editingUser.role === "babysitter" ? <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Hourly rate<input type="number" min="0" step="0.01" value={editingUser.hourlyRate ?? ""} onChange={(event) => setEditingUser({ ...editingUser, hourlyRate: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Experience (years)<input type="number" min="0" value={editingUser.experienceYears ?? ""} onChange={(event) => setEditingUser({ ...editingUser, experienceYears: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          </div> : <label className="block text-sm font-medium">Number of children<input type="number" min="0" value={editingUser.numberOfChildren ?? ""} onChange={(event) => setEditingUser({ ...editingUser, numberOfChildren: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>}
          {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => { setEditingUser(null); setErrorMessage(""); }} className="rounded border px-4 py-2">Cancel</button><button type="submit" className="rounded bg-blueGray-800 px-4 py-2 font-semibold text-white">Save changes</button></div>
        </form>
      </div>}
      <div>
          <h2 className="text-xl font-bold leading-normal mt-0 mb-2 text-lightBlue-700">Add New User</h2>
        
        <div className="mb-3 pt-0">
            <input type="text" placeholder="Name" className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4"
            onChange={handleInputChange} name="name"/>
        </div>
        <div className="mb-3 pt-0">
            <input type="email" placeholder="Email" className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4"
            onChange={handleInputChange} name="email"/>
        </div>
        <div className="mb-3 pt-0">
            <input type="password" placeholder="Password" className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4"
            onChange={handleInputChange} name="password"/>
        </div>
        <div className="mb-3 pt-0">
            <input type="tel" placeholder="phone" className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4"
            onChange={handleInputChange} name="phone"/>
        </div>
        <div className="mb-3 pt-0">
            <input type="text" placeholder="address" className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4"
            onChange={handleInputChange} name="adresse"/>
        </div>
       <div className="mb-3 pt-0">
        <select
          value={newUserData.role}
          className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4"
          onChange={handleInputChange}
          name="role"
        >
          <option value="parent">Parent</option>
          <option value="babysitter">Babysitter</option>
        </select>
      </div>
      {newUserData.role === "babysitter" && (
        <div className="mb-3 pt-0">
          <input
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Hourly rate"
            className="px-2 py-1 text-blueGray-600 bg-white rounded text-sm shadow w-1/4"
            onChange={handleInputChange}
            name="hourlyRate"
          />
        </div>
      )}
          <button
          className="bg-lightBlue-500 text-white active:bg-lightBlue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            onClick={handleAddUser}>
            Add User</button>  
             <button
          className="bg-red-500 text-white active:bg-red-800 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          onClick={() => { setNewUserData(emptyUser); setErrorMessage(""); }}
            >
            Cancel</button>   
      </div>
        
    </>
    
  );
}


CardTable.defaultProps = {
  color: "light",
};

CardTable.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]),
};
