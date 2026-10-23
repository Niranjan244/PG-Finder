import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PG from '../src/models/PG.js';
import Room from '../src/models/Room.js';
import User from '../src/models/User.js';

dotenv.config();

const newPGsData = [
  {
    title: 'Sri Venkateswara Elite PG for Boys',
    description: 'Spacious and well-maintained executive PG for boys located near Rotary Nagar. Includes 3 times homely South Indian food, high-speed Wi-Fi, daily housekeeping, 24/7 power backup, and CCTV security.',
    address: 'Near Head Post Office, Gandhi Chowk Road',
    city: 'khammam',
    area: 'rotary nagar',
    genderPreference: 'boys',
    deposit: 4000,
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
      'Washing Machine',
      'Daily Housekeeping',
      'CCTV Surveillance',
    ],
    rules: [
      'Gate closing at 10:30 PM',
      'No smoking inside premises',
      'Visitors allowed in lounge only',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_venkateswara_1',
      },
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_venkateswara_2',
      },
    ],
    location: {
      type: 'Point',
      coordinates: [80.1765, 17.2495],
    },
    rentRange: {
      minRent: 4500,
      maxRent: 9000,
    },
    status: 'approved',
    averageRating: 4.6,
    reviewCount: 6,
    rooms: [
      { roomNumber: '101', roomType: 'single', rent: 9000, totalBeds: 1, occupiedBeds: 0 },
      { roomNumber: '102', roomType: 'double', rent: 6000, totalBeds: 2, occupiedBeds: 1 },
      { roomNumber: '103', roomType: 'triple', rent: 4500, totalBeds: 3, occupiedBeds: 1 },
    ],
  },
  {
    title: 'Serenity Stay Luxury PG for Women',
    description: 'Safe, modern, and ultra-comfortable accommodation for working women and female students. Located centrally in Khammam with biometric access, high security, AC rooms, attached washrooms, and hygienic food.',
    address: 'Opposite District Library, Wyra Road',
    city: 'khammam',
    area: 'khammam',
    genderPreference: 'girls',
    deposit: 5000,
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
      'Geyser / Hot Water',
      'Washing Machine',
      'Daily Housekeeping',
      'CCTV Surveillance',
    ],
    rules: [
      'Gate closing at 10:00 PM',
      'Female guests only permitted',
      'ID verification mandatory',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_serenity_1',
      },
      {
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_serenity_2',
      },
    ],
    location: {
      type: 'Point',
      coordinates: [80.1520, 17.2470],
    },
    rentRange: {
      minRent: 5000,
      maxRent: 11000,
    },
    status: 'approved',
    averageRating: 4.8,
    reviewCount: 9,
    rooms: [
      { roomNumber: '201', roomType: 'single', rent: 11000, totalBeds: 1, occupiedBeds: 0 },
      { roomNumber: '202', roomType: 'double', rent: 7500, totalBeds: 2, occupiedBeds: 1 },
      { roomNumber: '203', roomType: 'triple', rent: 5000, totalBeds: 3, occupiedBeds: 2 },
    ],
  },
  {
    title: 'Royal Palms Luxury Co-Living',
    description: 'World-class co-living space designed for tech professionals and digital nomads in Electronic City. Features ergonomic workstations, high-speed fiber internet, gaming zone, gym access, and premium fully furnished suites.',
    address: 'Neeladri Road, Electronic City Phase 1',
    city: 'Bangalore',
    area: 'Electronic City',
    genderPreference: 'coliving',
    deposit: 8000,
    bookingTokenAmount: 1500,
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
      'No loud music after 11 PM',
      'Visitors allowed until 9 PM',
      'Pet friendly in designated rooms',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_royal_1',
      },
      {
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_royal_2',
      },
    ],
    location: {
      type: 'Point',
      coordinates: [77.6784, 12.8452],
    },
    rentRange: {
      minRent: 7500,
      maxRent: 16000,
    },
    status: 'approved',
    averageRating: 4.7,
    reviewCount: 14,
    rooms: [
      { roomNumber: '301', roomType: 'single', rent: 16000, totalBeds: 1, occupiedBeds: 0 },
      { roomNumber: '302', roomType: 'double', rent: 10500, totalBeds: 2, occupiedBeds: 1 },
      { roomNumber: '303', roomType: 'triple', rent: 7500, totalBeds: 3, occupiedBeds: 1 },
    ],
  },
  {
    title: 'Urban Nest Executive Suites',
    description: 'Chic urban retreat in the heart of Indiranagar with cafes, metro station, and commercial hubs within walking distance. Designer interiors, private balconies, weekly deep cleaning, and friendly community vibe.',
    address: '100ft Road, Near Metro Station, Indiranagar',
    city: 'Bangalore',
    area: 'Indiranagar',
    genderPreference: 'coliving',
    deposit: 12000,
    bookingTokenAmount: 2000,
    wifi: true,
    foodDetails: {
      available: false,
      mealTypes: [],
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
      'Smoking prohibited inside building',
      'Passkey access strictly for residents',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_urban_1',
      },
      {
        url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed_pg_urban_2',
      },
    ],
    location: {
      type: 'Point',
      coordinates: [77.6412, 12.9719],
    },
    rentRange: {
      minRent: 9000,
      maxRent: 21000,
    },
    status: 'approved',
    averageRating: 4.8,
    reviewCount: 18,
    rooms: [
      { roomNumber: '401', roomType: 'single', rent: 21000, totalBeds: 1, occupiedBeds: 0 },
      { roomNumber: '402', roomType: 'double', rent: 13000, totalBeds: 2, occupiedBeds: 1 },
      { roomNumber: '403', roomType: 'triple', rent: 9000, totalBeds: 3, occupiedBeds: 2 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('No owner found to associate listings with');
      process.exit(1);
    }

    console.log(`Using owner: ${owner.name} (${owner._id})`);

    for (const item of newPGsData) {
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
    console.log(`\nAll done! Total approved PGs in database: ${totalPGs}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
