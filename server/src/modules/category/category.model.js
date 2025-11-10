const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
});

module.export = mongoose.model('Category', CategorySchema);
