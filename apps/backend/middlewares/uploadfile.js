const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "public", "images");
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function isValidImage(file) {
  const bytes = file.buffer;
  if (!bytes) return false;
  switch (file.mimetype) {
    case "image/jpeg": return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png": return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
    case "image/gif": return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"));
    case "image/webp": return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    default: return false;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!extensions[file.mimetype]) {
      const error = new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

upload.isValidImage = isValidImage;
upload.saveImage = async (file) => {
  if (!isValidImage(file)) throw Object.assign(new Error("The uploaded file is not a valid image"), { status: 400 });
  const filename = crypto.randomUUID() + extensions[file.mimetype];
  const filepath = path.join(uploadDirectory, filename);
  await fs.promises.writeFile(filepath, file.buffer, { flag: "wx" });
  return { filename, filepath };
};

module.exports = upload;
