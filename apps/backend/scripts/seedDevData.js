require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user.model");
const Reservation = require("../models/reservation.model");
const ReservationSlot = require("../models/reservation-slot.model");
const Household = require("../models/household.model");
const Avis = require("../models/avis.model");
const Message = require("../models/message.model");
const Notification = require("../models/notification.model");
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
  {
    key: "parent.casey",
    name: "Casey Morgan",
    phone: "+15550100104",
    adresse: "Brooklyn, New York",
    numberOfChildren: 2,
    specialRequirements: "Shared household with Alex; same children and sitter plan.",
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

async function upsertDemoHousehold(firstParent, secondParent) {
  const [firstHousehold, secondHousehold] = await Promise.all([
    firstParent.household ? Household.findById(firstParent.household) : null,
    secondParent.household ? Household.findById(secondParent.household) : null,
  ]);
  if (firstHousehold && secondHousehold && String(firstHousehold._id) !== String(secondHousehold._id)) {
    throw new Error("Demo parents already belong to different households; refusing to merge existing household data");
  }
  let household = firstHousehold || secondHousehold || await Household.findOne({ members: firstParent._id });
  if (!household) household = new Household();
  const memberIds = new Set((household.members || []).map(String));
  memberIds.add(String(firstParent._id));
  memberIds.add(String(secondParent._id));
  household.members = [...memberIds];
  const childNames = new Set((household.children || []).map((child) => child.name.toLowerCase()));
  if (!childNames.has("sarah")) household.children.push({ name: "Sarah", age: 4 });
  if (!childNames.has("leo")) household.children.push({ name: "Leo", age: 2 });
  await household.save();
  firstParent.household = household._id;
  secondParent.household = household._id;
  await Promise.all([firstParent.save(), secondParent.save()]);
  return household;
}

async function upsertDemoReview({ reviewer, reviewee, parent, babysitter, reservation, rating, comment }) {
  await Avis.findOneAndUpdate(
    { reviewer: reviewer._id, reservation: reservation._id },
    { $set: { reviewer: reviewer._id, reviewee: reviewee._id, parent: parent._id, babysitter: babysitter._id, reservation: reservation._id, rating, comment } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
}

async function upsertDemoMessage({ sender, recipient, text }) {
  await Message.findOneAndUpdate(
    { sender: sender._id, recipient: recipient._id, text },
    { $setOnInsert: { sender: sender._id, recipient: recipient._id, text, readAt: undefined } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
}

async function upsertDemoNotification({ user, message, type = "reservation" }) {
  await Notification.findOneAndUpdate(
    { user: user._id, message },
    { $set: { type, read: false } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
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
    {
      key: "casey-lina-confirmed",
      parent: users.get("parent.casey"),
      babysitter: users.get("babysitter.lina"),
      dayOffset: 2,
      startTime: "10:00",
      endTime: "12:00",
      status: "confirmed",
      notes: "A shared household booking; please bring story books.",
    },
  ];

  const bookingRecords = new Map();
  for (const booking of bookings) bookingRecords.set(booking.key, await upsertDemoBooking(booking));

  const household = await upsertDemoHousehold(users.get("parent.alex"), users.get("parent.casey"));
  await Promise.all([
    upsertDemoReview({
      reviewer: users.get("parent.alex"), reviewee: users.get("babysitter.noah"),
      parent: users.get("parent.alex"), babysitter: users.get("babysitter.noah"),
      reservation: bookingRecords.get("alex-noah-completed"), rating: 5,
      comment: "Reliable, kind, and great with the children.",
    }),
    upsertDemoReview({
      reviewer: users.get("babysitter.noah"), reviewee: users.get("parent.alex"),
      parent: users.get("parent.alex"), babysitter: users.get("babysitter.noah"),
      reservation: bookingRecords.get("alex-noah-completed"), rating: 5,
      comment: "Clear instructions and a welcoming family.",
    }),
    upsertDemoMessage({
      sender: users.get("parent.casey"), recipient: users.get("babysitter.lina"),
      text: "Thanks for confirming. Sarah loves adventure stories.",
    }),
    upsertDemoMessage({
      sender: users.get("babysitter.lina"), recipient: users.get("parent.casey"),
      text: "Looking forward to it. I will bring a few books.",
    }),
    upsertDemoNotification({
      user: users.get("babysitter.lina"),
      message: "A confirmed demo booking with Casey is on your plan.",
    }),
    upsertDemoNotification({
      user: users.get("parent.casey"),
      message: "Your shared household booking with Lina is confirmed.",
    }),
    upsertDemoNotification({
      user: users.get("parent.alex"),
      message: "You have a pending demo booking request with Lina.",
    }),
    upsertDemoNotification({
      user: users.get("babysitter.lina"),
      message: "You have received a new reservation request from Alex Morgan.",
    }),
  ]);

  console.info(`Seeded ${parents.length} parents, ${babysitters.length} babysitters, and ${bookings.length} bookings in ${mongoose.connection.name}.`);
  console.info(`Seeded household (${household.children.length} children), 2 reviews, 2 messages, and demo notifications.`);
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
