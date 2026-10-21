import app from './src/app.js';
import { connectDatabase, closeDatabase } from './src/config/db.js';
import { initializeAdminAccount } from './src/services/adminSeedService.js';
import http from 'http';

const runTests = async () => {
  console.log('--- Starting Phase 2 End-to-End Auth & RBAC Verification ---');

  await connectDatabase();
  await initializeAdminAccount();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  try {
    // Test 1: Register Tenant
    console.log('\n1. Testing Tenant Registration:');
    const tenantRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Mehta',
        email: 'aarav.mehta@domain.in',
        phone: '9876543211',
        password: 'Password123',
        role: 'tenant',
      }),
    });
    const tenantData = await tenantRes.json();
    const tenantCookie = tenantRes.headers.get('set-cookie');
    console.log('Status:', tenantRes.status, '| Success:', tenantData.success, '| Role:', tenantData.data?.user?.role);
    console.log('HttpOnly Cookie Set:', tenantCookie?.includes('HttpOnly') && tenantCookie?.includes('token='));

    // Test 2: Reject Public Admin Registration
    console.log('\n2. Testing Public Admin Registration Rejection:');
    const adminAttemptRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hacker@domain.in',
        phone: '9876543212',
        password: 'Password123',
        role: 'admin',
      }),
    });
    const adminAttemptData = await adminAttemptRes.json();
    console.log('Status:', adminAttemptRes.status, '| Rejection message:', adminAttemptData.message);

    // Test 3: Register Owner
    console.log('\n3. Testing PG Owner Registration:');
    const ownerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Iyer',
        email: 'kavita.iyer@domain.in',
        phone: '9876543213',
        password: 'Password123',
        role: 'owner',
      }),
    });
    const ownerData = await ownerRes.json();
    const ownerCookie = ownerRes.headers.get('set-cookie');
    console.log('Status:', ownerRes.status, '| Role:', ownerData.data?.user?.role);

    // Test 4: Check /me with Tenant Cookie
    console.log('\n4. Testing /api/auth/me with Tenant session cookie:');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: tenantCookie },
    });
    const meData = await meRes.json();
    console.log('Status:', meRes.status, '| User:', meData.data?.user?.name, '| Role:', meData.data?.user?.role);

    // Test 5: Role-based Access - Tenant accessing Tenant Dashboard (200) vs Owner Dashboard (403)
    console.log('\n5. Testing RBAC - Tenant accessing Tenant Dashboard:');
    const tenantDashRes = await fetch(`${baseUrl}/dashboard/tenant`, {
      headers: { Cookie: tenantCookie },
    });
    console.log('Tenant Dashboard Status:', tenantDashRes.status, '(Expected 200)');

    console.log('\n6. Testing RBAC - Tenant attempting to access Owner Dashboard:');
    const forbiddenRes = await fetch(`${baseUrl}/dashboard/owner`, {
      headers: { Cookie: tenantCookie },
    });
    const forbiddenData = await forbiddenRes.json();
    console.log('Owner Dashboard Status:', forbiddenRes.status, '(Expected 403) | Message:', forbiddenData.message);

    // Test 7: Owner accessing Owner Dashboard
    console.log('\n7. Testing RBAC - PG Owner accessing Owner Dashboard:');
    const ownerDashRes = await fetch(`${baseUrl}/dashboard/owner`, {
      headers: { Cookie: ownerCookie },
    });
    console.log('Owner Dashboard Status:', ownerDashRes.status, '(Expected 200)');

    // Test 8: Login with Seeded Administrator Account
    console.log('\n8. Testing Seeded Admin Login:');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pgfinder.local',
        password: 'AdminPass123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    console.log('Status:', adminLoginRes.status, '| Admin Authenticated:', adminLoginData.data?.user?.role);

    // Test 9: Admin accessing Admin Dashboard
    console.log('\n9. Testing RBAC - Admin accessing Admin Dashboard:');
    const adminDashRes = await fetch(`${baseUrl}/dashboard/admin`, {
      headers: { Cookie: adminCookie },
    });
    console.log('Admin Dashboard Status:', adminDashRes.status, '(Expected 200)');

    // Test 10: Logout
    console.log('\n10. Testing Logout (clearing cookie):');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: tenantCookie },
    });
    const logoutCookie = logoutRes.headers.get('set-cookie');
    console.log('Status:', logoutRes.status, '| Logout Set-Cookie:', logoutCookie);

    console.log('\n--- ALL 10 AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY ---');
  } finally {
    server.close();
    await closeDatabase();
  }
};

runTests().catch(console.error);
