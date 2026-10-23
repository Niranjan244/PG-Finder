import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PG from '../src/models/PG.js';
import Room from '../src/models/Room.js';
import User from '../src/models/User.js';

dotenv.config();

const additionalPGs = [
  {
    title: 'Zolo Silicon Oasis Co-Living',
    description: 'Modern co-living space tailored for IT professionals and university students. Situated in BTM Layout with fully furnished air-conditioned rooms, gaming lounge, cafeteria, high-speed fiber Wi-Fi, and 24/7 security.',
    address: '7th Main, 2nd Stage, Near Madiwala Lake, BTM Layout',
    city: 'Bangalore',
    area: 'BTM Layout',
    genderPreference: 'coliving',
    deposit: 6000,
    bookingTokenAmount: 1000,
    wifi: true,
    foodDetails: {
      available: true,
      mealTypes: ['breakfast', 'dinner'],
      isPureVeg: false,
    },
    amenities: [
      'Air Conditioning',
      'High-Speed Wi-Fi',
      'Power Backup',
      'RO Drinking Water',
      'Washing Machine',
      'Daily Housekeeping',
      'CCTV Surveillance',
      'Geyser / Hot Water',
    ],
    rules: [
      'Passkey access strictly for residents',
      'Quiet hours after 11 PM',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_zolo_silicon_1',
      },
      {
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_zolo_silicon_2',
      },
    ],
    location: {
      type: 'Point',
      coordinates: [77.6101, 12.9166],
    },
    rentRange: {
      minRent: 6500,
      maxRent: 14000,
    },
    status: 'approved',
    averageRating: 4.7,
    reviewCount: 12,
    rooms: [
      { roomNumber: '101', roomType: 'single', rent: 14000, totalBeds: 1, occupiedBeds: 0 },
      { roomNumber: '102', roomType: 'double', rent: 8500, totalBeds: 2, occupiedBeds: 1 },
      { roomNumber: '103', roomType: 'triple', rent: 6500, totalBeds: 3, occupiedBeds: 1 },
    ],
  },
  {
    title: 'Kakatiya Residency Luxury PG for Gents',
    description: 'Top-rated executive gents accommodation in Khammam near Bus Stand & Station Road. Features spacious ventilated rooms, attached bathrooms, 3-times tasty Andhra meals, daily cleaning, RO water, and CCTV.',
    address: 'Opp. Old Bus Stand, Railway Station Road',
    city: 'khammam',
    area: 'khammam',
    genderPreference: 'boys',
    deposit: 3500,
    bookingTokenAmount: 1000,
    wifi: true,
    foodDetails: {
      available: true,
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      isPureVeg: false,
    },
    amenities: [
      'Air Conditioning',
      'High-Speed Wi-Fi',
      'Power Backup',
      'RO Drinking Water',
      'Daily Housekeeping',
      'CCTV Surveillance',
      'Geyser / Hot Water',
    ],
    rules: [
      'Gate closing at 10:30 PM',
      'No smoking inside rooms',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_kakatiya_1',
      },
      {
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_kakatiya_2',
      },
    ],
    location: {
      type: 'Point',
      coordinates: [80.1540, 17.2460],
    },
    rentRange: {
      minRent: 4000,
      maxRent: 8500,
    },
    status: 'approved',
    averageRating: 4.6,
    reviewCount: 7,
    rooms: [
      { roomNumber: '201', roomType: 'single', rent: 8500, totalBeds: 1, occupiedBeds: 0 },
      { roomNumber: '202', roomType: 'double', rent: 5500, totalBeds: 2, occupiedBeds: 1 },
      { roomNumber: '203', roomType: 'triple', rent: 4000, totalBeds: 3, occupiedBeds: 1 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('No owner found');
      process.exit(1);
    }

    for (const item of additionalPGs) {
      const existing = await PG.findOne({ title: item.title });
      if (existing) {
        console.log(`PG already exists: ${item.title}`);
        continue;
      }

      const { rooms, ...pgFields } = item;
      const createdPG = await PG.create({
        ...pgFields,
        owner: owner._id,
      });

      console.log(`Created PG: ${createdPG.title} (ID: ${createdPG._id})`);

      for (const roomData of rooms) {
        await Room.create({
          ...roomData,
          pg: createdPG._id,
        });
      }
      console.log(`  Added ${rooms.length} rooms for ${createdPG.title}`);
    }

    const totalPGs = await PG.countDocuments({ status: 'approved' });
    console.log(`\nSuccess! Total approved PGs in database: ${totalPGs}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
