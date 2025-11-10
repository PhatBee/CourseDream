const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["student", "instructor", "admin"], default: "student" },
  avatar: String,
  bio: String,
  expertise: [String], // dành cho instructor
}, { timestamps: true });

module.export = mongoose.model('User', UserSchema);