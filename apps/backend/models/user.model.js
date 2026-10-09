const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please fill a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number",
      ],
    },

    adresse: {
      type: String,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },

    role: {
      type: String,
      enum: ["admin", "babysitter", "parent"],
      default: "parent",
    },

    image: {
      type: String,
      default: "default.jpg",
    },

    block: {
      type: Boolean,
      default: false,
    },

    // --- Parent fields ---
    numberOfChildren: {
      type: Number,
      min: [0, "Number of children cannot be negative"],
    },

    specialRequirements: {
      type: String,
    },

    household: { type: mongoose.Schema.Types.ObjectId, ref: "Household" },

    // --- Babysitter fields ---
    hourlyRate: {
      type: Number,
      required: function () {
        return this.role === "babysitter";
      },
      min: [0, "Hourly rate cannot be negative"],
    },

    experienceYears: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
    },

    hasBackgroundCheck: {
      type: Boolean,
      default: false,
    },

    experience: {
      type: String, // Text biography or summary
    },

    availability: {
      type: String,
    },

    certif: {
      type: String,
    },

    score: {
      type: Number,
      default: 5.0,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, value) {
        delete value.password;
        delete value.adminCode;
        delete value.loginAttempts;
        return value;
      },
    },
  }
);

/**
 * Hash password automatically before saving to database
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; 

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err; 
  }
});

userSchema.statics.authenticate = async function (email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await this.findOne({ email: normalizedEmail }).select("+password");
  if (!user || user.block) return null;

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    const failed = await this.findOneAndUpdate(
      { _id: user._id, block: { $ne: true } },
      { $inc: { loginAttempts: 1 } },
      { new: true }
    );
    if (failed && failed.loginAttempts >= 5) {
      await this.updateOne({ _id: user._id }, { $set: { block: true } });
    }
    return null;
  }

  await this.updateOne({ _id: user._id }, { $set: { loginAttempts: 0 } });
  user.password = undefined;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
