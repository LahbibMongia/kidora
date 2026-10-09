require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user.model");
const Reservation = require("../models/reservation.model");
const ReservationSlot = require("../models/reservation-slot.model");
const { getMongoUri } = require("../config/db");

const DEMO_PASSWORD = "KidoraDemo123";
const parents = [
  {
    key: "parent.alex",
    name: "Alex Morgan",
    phone: "+15550100101",
    adresse: "Brooklyn, New York",
    numberOfChildren: 2,
    specialRequirements: "No peanuts; bedtime around 8:30 PM.",
  },
  {
    key: "parent.jamie",
    name: "Jamie Chen",
    phone: "+15550100102",
    adresse: "Queens, New York",
    numberOfChildren: 1,
    specialRequirements: "Likes drawing and outdoor activities.",
  },
  {
    key: "parent.taylor",
    name: "Taylor Rivera",
    phone: "+15550100103",
    adresse: "Jersey City, New Jersey",
    numberOfChildren: 3,
    specialRequirements: "One child has a mild cat allergy.",
  },
];

const babysitters = [
  {
    key: "babysitter.lina",
    name: "Lina Haddad",
    phone: "+15550200101",
    adresse: "Brooklyn, New York",
    hourlyRate: 20,
    experienceYears: 5,
    hasBackgroundCheck: true,
    experience: "Experienced caregiver who enjoys reading, crafts, and outdoor play.",
    availability: "Weekdays after 3 PM and weekends.",
    certif: "CPR and First Aid certified",
  },
  {
    key: "babysitter.amir",
    name: "Amir Johnson",
    phone: "+15550200102",
    adresse: "Queens, New York",
    hourlyRate: 24,
    experienceYears: 8,
    hasBackgroundCheck: true,
    experience: "Patient early childhood educator and homework helper.",
    availability: "Weekday evenings.",
    certif: "CPR certified",
  },
  {
    key: "babysitter.sofia",
    name: "Sofia Laurent",
    phone: "+15550200103",
    adresse: "Jersey City, New Jersey",
    hourlyRate: 18,
    experienceYears: 3,
    hasBackgroundCheck: false,
    experience: "Creative sitter who loves music, baking, and games.",
    availability: "Flexible weekends.",
    certif: "Early childhood care coursework",
  },
  {
    key: "babysitter.noah",
    name: "Noah Williams",
    phone: "+15550200104",
    adresse: "Brooklyn, New York",
    hourlyRate: 22,
    experienceYears: 6,
    hasBackgroundCheck: true,
    experience: "Reliable caregiver with infant and toddler experience.",
    availability: "Monday to Friday.",
    certif: "CPR and First Aid certified",
  },
];

function demoEmail(key) {
  return `demo.${key}@example.test`;
}

function utcDayOffset(offset) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

async function upsertDemoUser(data, role) {
  const email = demoEmail(data.key);
  let user = await User.findOne({ email });
  if (!user) user = new User({ email });

  user.set({ ...data, email, role, password: DEMO_PASSWORD, block: false });
  await user.save();
  return user;
}

async function upsertDemoBooking({ key, parent, babysitter, dayOffset, startTime, endTime, status, notes }) {
  const seedNote = `[KidOra demo seed: ${key}] ${notes}`;
  let booking = await Reservation.findOne({ notes: { $regex: `^\\[KidOra demo seed: ${key}\\]` } });
  if (!booking) booking = new Reservation();

  booking.set({
    parent,
    babysitter,
    date: utcDayOffset(dayOffset),
    startTime,
    endTime,
    timeSlot: `${startTime}-${endTime}`,
    status,
    notes: seedNote,
    totalPrice: ((Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3))) -
      (Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3)))) / 60 * babysitter.hourlyRate,
  });
  await booking.save();

  await ReservationSlot.deleteMany({ reservation: booking._id });
  if (["pending", "confirmed"].includes(status)) {
    const start = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3));
    const end = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3));
    await ReservationSlot.insertMany(Array.from({ length: end - start }, (_, index) => ({
      babysitter: babysitter._id,
      day: booking.date.toISOString().slice(0, 10),
      minute: start + index,
      reservation: booking._id,
    })));
  }
  return booking;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production");
  }

  const uri = getMongoUri();
  const parsedUri = new URL(uri);
  if (!parsedUri.hostname || !["localhost", "127.0.0.1", "::1"].includes(parsedUri.hostname)) {
    throw new Error("Development seed data may only be written to a local MongoDB instance");
  }

  await mongoose.connect(uri);
  await ReservationSlot.init();

  const users = new Map();
  for (const parent of parents) users.set(parent.key, await upsertDemoUser(parent, "parent"));
  for (const sitter of babysitters) users.set(sitter.key, await upsertDemoUser(sitter, "babysitter"));

  const bookings = [
    {
      key: "alex-lina-pending",
      parent: users.get("parent.alex"),
      babysitter: users.get("babysitter.lina"),
      dayOffset: 1,
      startTime: "17:00",
      endTime: "19:00",
      status: "pending",
      notes: "Please help with dinner and bedtime.",
    },
    {
      key: "jamie-amir-confirmed",
      parent: users.get("parent.jamie"),
      babysitter: users.get("babysitter.amir"),
      dayOffset: 3,
      startTime: "09:00",
      endTime: "12:00",
      status: "confirmed",
      notes: "Morning care while I am at work.",
    },
    {
      key: "taylor-sofia-pending",
      parent: users.get("parent.taylor"),
      babysitter: users.get("babysitter.sofia"),
      dayOffset: 5,
      startTime: "13:00",
      endTime: "16:00",
      status: "pending",
      notes: "Afternoon games and a snack.",
    },
    {
      key: "alex-noah-completed",
      parent: users.get("parent.alex"),
      babysitter: users.get("babysitter.noah"),
      dayOffset: -7,
      startTime: "14:00",
      endTime: "16:00",
      status: "completed",
      notes: "A completed sample booking.",
    },
  ];

  for (const booking of bookings) await upsertDemoBooking(booking);

  console.info(`Seeded ${parents.length} parents, ${babysitters.length} babysitters, and ${bookings.length} bookings in ${mongoose.connection.name}.`);
  console.info(`Demo login for all seeded accounts: password ${DEMO_PASSWORD}`);
  for (const record of [...parents, ...babysitters]) {
    console.info(`  ${record.name}: ${demoEmail(record.key)}`);
  }
}

main()
  .catch((error) => {
    console.error("Development seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
