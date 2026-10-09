import API from "./api";

/**
 * Retrieves all users from the system.
 * @GET /users
 */
export const getAllUsers = () => {
  return API.get("/users");
};

/**
 * Removes a user by their unique ID.
 * @DELETE /users/:id
 */
export const deleteUser = (id) => {
  return API.delete(`/users/${id}`);
};

/**
 * Registers/Adds a new user to the database.
 * @POST /users
 */
export const addUser = (userData) => {
  return API.post("/users", userData);
};

/**
 * Updates an existing user's details.
 * @PUT /users/:id
 */
export const updateUser = (id, userData) => {
  return API.put(`/users/${id}`, userData);
};

/**
 * Fetches a single user's detailed profile.
 * @GET /users/:id
 */
export const getUserById = (id) => {
  return API.get(`/users/${id}`);
};

