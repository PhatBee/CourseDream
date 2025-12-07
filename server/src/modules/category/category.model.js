import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  icon: { 
    type: String,
    default: null 
  },
});

CategorySchema.index({ name: 'text' });

export default mongoose.model('Category', CategorySchema);