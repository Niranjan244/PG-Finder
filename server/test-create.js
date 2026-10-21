import jwt from 'jsonwebtoken';
import { env } from './src/config/env.js';
import User from './src/models/User.js';
import PG from './src/models/PG.js';
import { connectDatabase, closeDatabase } from './src/config/db.js';

const testCreateListing = async () => {
  await connectDatabase();
  const owner = await User.findOne({ role: 'owner' });
  const token = jwt.sign(
    { sub: owner._id, email: owner.email, role: owner.role },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  const payload = {
    title: 'Test Create And Proceed PG',
    description: 'This is a test description exceeding twenty characters for validation.',
    genderPreference: 'coliving',
    deposit: 5000,
    city: 'Bangalore',
    area: 'Indiranagar',
    address: '100 Feet Road, Indiranagar',
    latitude: 12.9716,
    longitude: 77.5946,
    foodDetails: {
      available: false,
      mealTypes: [],
      isPureVeg: false,
    },
    wifi: true,
    amenities: ['High-Speed Wi-Fi'],
    rules: ['No smoking'],
    images: [],
  };

  console.log('Sending POST /api/owner/pgs...');
  const res = await fetch('http://localhost:5000/api/owner/pgs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response data:', data);

  if (res.status === 201 && data.data?.pg?._id) {
    console.log('Created PG ID:', data.data.pg._id);
    // Cleanup
    await PG.findByIdAndDelete(data.data.pg._id);
    console.log('Test listing cleaned up.');
  } else {
    throw new Error('Failed to create listing');
  }

  await closeDatabase();
};

testCreateListing().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
