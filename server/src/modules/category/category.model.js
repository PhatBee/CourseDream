import mongoose from 'mongoose';


const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
});

const Category = mongoose.model('Category', CategorySchema);
export default Category;
