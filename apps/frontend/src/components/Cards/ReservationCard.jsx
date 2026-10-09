// components/ReservationCard.js

import React from "react";

const badgeColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
};

export default function ReservationCard({
    reservation,
    onCancel,
}) {
    const {
        _id,
        babysitterId,
        date,
        startTime,
        endTime,
        totalPrice,
        status,
    } = reservation;

    return (
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col md:flex-row justify-between items-center gap-4">

            <div className="flex items-center gap-4">

                <img
                    src={
                        babysitterId?.profilePicture ||
                        "/default-avatar.png"
                    }
                    alt="Babysitter"
                    className="w-16 h-16 rounded-full object-cover"
                />

                <div>

                    <h3 className="font-bold text-lg">
                        {babysitterId?.name}
                    </h3>

                    <p className="text-gray-500">
                        {date}
                    </p>

                    <p className="text-gray-500">
                        {startTime} - {endTime}
                    </p>

                    <p className="font-semibold mt-2">
                        ${totalPrice}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-3">

                <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${badgeColors[status]}`}
                >
                    {status}
                </span>

                {status === "pending" && (
                    <button
                        onClick={() => onCancel(_id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                    >
                        Cancel Reservation
                    </button>
                )}

                {status === "confirmed" && (
                    <button
                        disabled
                        className="bg-green-400 text-white px-4 py-2 rounded cursor-not-allowed"
                    >
                        Confirmed
                    </button>
                )}

                {status === "cancelled" && (
                    <button
                        disabled
                        className="bg-gray-500 text-white px-4 py-2 rounded cursor-not-allowed"
                    >
                        Cancelled
                    </button>
                )}

                {status === "completed" && (
                    <button
                        disabled
                        className="bg-blue-500 text-white px-4 py-2 rounded cursor-not-allowed"
                    >
                        Completed
                    </button>
                )}
            </div>
        </div>
    );
}