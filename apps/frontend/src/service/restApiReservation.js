import API from "./api"; // Import the central instance directly

export const createReservation = (reservationData) => {
  return API.post("/reservations", reservationData);
};

export const getParentReservations = (parentId) => {
  return API.get(`/reservations/parent/${parentId}`);
};

export const getBabysitterReservations = (babysitterId) => {
  return API.get(`/reservations/babysitter/${babysitterId}`);
};

export const cancelReservation = (reservationId) => {
  return API.patch(`/reservations/${reservationId}/cancel`);
};

export const confirmReservation = (reservationId) => {
  return API.patch(`/reservations/${reservationId}/confirm`);
};

export const rejectReservation = (reservationId) => {
  return API.patch(`/reservations/${reservationId}/reject`);
};
