import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import fallbackAvatar from "assets/img/team-2-800x800.jpg";

// components
import { getAllUsers, deleteUser, addUser, updateUser } from "../../service/restApiUser";

export default function CardTable({ color }) {
  // States
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const emptyUser = { name: "", email: "", password: "", role: "parent", adresse: "", phone: "", hourlyRate: "", experienceYears: "" };
  const [newUserData, setNewUserData] = useState(emptyUser);
  const [editingUser, setEditingUser] = useState(null);

  // Filter users based on role selection
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter === "all") return true;
      return user.role?.toLowerCase() === roleFilter;
    });
  }, [users, roleFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData((current) => ({ ...current, [name]: value }));
  };

  const getUsers = useCallback(async () => {
    try {
      const res = await getAllUsers();
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

  useEffect(() => {
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

        {/* Role Filter Dropdown */}
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="roleFilter" className="text-sm font-semibold text-blueGray-100">
            Filter by role:
          </label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-blueGray-200 bg-white px-4 py-2 text-sm text-blueGray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-lightBlue-300"
          >
            <option value="all">All users</option>
            <option value="parent">Parents</option>
            <option value="babysitter">Babysitters</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className={"px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " + (color === "light" ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100" : "bg-lightBlue-800 text-lightBlue-200 border-lightBlue-700")}>Name</th>
                <th className={"px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " + (color === "light" ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100" : "bg-lightBlue-800 text-lightBlue-200 border-lightBlue-700")}>Email</th>
                <th className={"px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " + (color === "light" ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100" : "bg-lightBlue-800 text-lightBlue-200 border-lightBlue-700")}>Role</th>
                <th className={"px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " + (color === "light" ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100" : "bg-lightBlue-800 text-lightBlue-200 border-lightBlue-700")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id || user.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 font-bold">
                      {user.name}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.email}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 capitalize">
                      {user.role}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 gap-2 flex">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="bg-emerald-500 text-white px-3 py-1 rounded font-bold uppercase text-xs shadow hover:shadow-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id || user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded font-bold uppercase text-xs shadow hover:shadow-md"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-blueGray-500">
                    No users found matching the selected role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <form onSubmit={handleUpdateUser} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="edit-user-heading">
            <div>
              <h2 id="edit-user-heading" className="text-xl font-bold text-blueGray-800">Edit user</h2>
              <p className="mt-1 text-sm text-blueGray-500">Update account details for {editingUser.email}.</p>
            </div>
            <label className="block text-sm font-medium">Name<input required value={editingUser.name || ""} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block text-sm font-medium">Phone<input required value={editingUser.phone || ""} onChange={(event) => setEditingUser({ ...editingUser, phone: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            <label className="block text-sm font-medium">Address<input value={editingUser.adresse || ""} onChange={(event) => setEditingUser({ ...editingUser, adresse: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            {editingUser.role === "babysitter" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">Hourly rate<input type="number" min="0" step="0.01" value={editingUser.hourlyRate ?? ""} onChange={(event) => setEditingUser({ ...editingUser, hourlyRate: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
                <label className="text-sm font-medium">Experience (years)<input type="number" min="0" value={editingUser.experienceYears ?? ""} onChange={(event) => setEditingUser({ ...editingUser, experienceYears: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
              </div>
            ) : (
              <label className="block text-sm font-medium">Number of children<input type="number" min="0" value={editingUser.numberOfChildren ?? ""} onChange={(event) => setEditingUser({ ...editingUser, numberOfChildren: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
            )}
            {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setEditingUser(null); setErrorMessage(""); }} className="rounded border px-4 py-2">Cancel</button>
              <button type="submit" className="rounded bg-blueGray-800 px-4 py-2 font-semibold text-white">Save changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Add New User Form */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold leading-normal mt-0 mb-2 text-lightBlue-700">Add New User</h2>
        <div className="mb-3 pt-0">
          <input type="text" placeholder="Name" value={newUserData.name} className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4" onChange={handleInputChange} name="name" />
        </div>
        <div className="mb-3 pt-0">
          <input type="email" placeholder="Email" value={newUserData.email} className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4" onChange={handleInputChange} name="email" />
        </div>
        <div className="mb-3 pt-0">
          <input type="password" placeholder="Password" value={newUserData.password} className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4" onChange={handleInputChange} name="password" />
        </div>
        <div className="mb-3 pt-0">
          <input type="tel" placeholder="Phone" value={newUserData.phone} className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4" onChange={handleInputChange} name="phone" />
        </div>
        <div className="mb-3 pt-0">
          <input type="text" placeholder="Address" value={newUserData.adresse} className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4" onChange={handleInputChange} name="adresse" />
        </div>
        <div className="mb-3 pt-0">
          <select value={newUserData.role} className="px-2 py-1 placeholder-blueGray-400 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:shadow-outline w-1/4" onChange={handleInputChange} name="role">
            <option value="parent">Parent</option>
            <option value="babysitter">Babysitter</option>
          </select>
        </div>
        {newUserData.role === "babysitter" && (
          <div className="mb-3 pt-0">
            <input type="number" min="0" step="0.01" value={newUserData.hourlyRate} required placeholder="Hourly rate" className="px-2 py-1 text-blueGray-600 bg-white rounded text-sm shadow w-1/4" onChange={handleInputChange} name="hourlyRate" />
          </div>
        )}
        <button className="bg-lightBlue-500 text-white active:bg-lightBlue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" onClick={handleAddUser}>
          Add User
        </button>
        <button className="bg-red-500 text-white active:bg-red-800 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" onClick={() => { setNewUserData(emptyUser); setErrorMessage(""); }}>
          Cancel
        </button>
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