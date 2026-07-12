import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Payment from '../src/modules/payment/payment.model.js';

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('Error: MONGO_URI is missing in environment variables.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');

    // Count payments without paymentType (not exists or null)
    const query = {
      $or: [
        { paymentType: { $exists: false } },
        { paymentType: null }
      ]
    };

    const count = await Payment.countDocuments(query);
    console.log(`Found ${count} payment(s) without a paymentType.`);

    if (count > 0) {
      console.log('Updating payments...');
      const result = await Payment.updateMany(query, {
        $set: { paymentType: 'purchase' }
      });
      console.log(`Successfully updated ${result.modifiedCount} payment(s).`);
    } else {
      console.log('No payments need updating.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('An error occurred:', err);
    process.exit(1);
  }
})();
