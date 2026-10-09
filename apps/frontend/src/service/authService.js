import API from "./api";

/**
 * Log in a user with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} The backend JSON response data
 */
export async function login(email, password) {
  const response = await API.post("/users/login", { email, password });
  return response.data;
}

/**
 * Register a new user.
 * @param {object} userData { name, email, password }
 * @returns {Promise<object>} The backend JSON response data
 */
export async function register(userData) {
  const response = await API.post("/users/register", userData);
  return response.data;
}
