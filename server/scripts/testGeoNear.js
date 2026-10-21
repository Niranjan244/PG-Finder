import { connectDatabase } from '../src/config/db.js';
import PG from '../src/models/PG.js';

async function testGeo() {
  await connectDatabase();
  const res = await PG.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [77.6245, 12.9352] },
        distanceField: 'distanceMeters',
        maxDistance: 10000,
        spherical: true,
        query: { status: 'approved' },
      },
    },
    {
      $project: {
        title: 1,
        area: 1,
        distanceMeters: 1,
        location: 1,
      },
    },
  ]);

  console.log('Results within 10km of Koramangala:');
  res.forEach((pg) => {
    console.log(`- ${pg.title} (${pg.area}): ${(pg.distanceMeters / 1000).toFixed(2)} km away`);
  });
  process.exit(0);
}

testGeo().catch(console.error);
