import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/user.model';
import { Server } from 'http';

const TEST_PORT = 5001;
const TEST_HOST = '127.0.0.1';
const TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/canteen_test';

// Set environment variables for the test environment
process.env.JWT_SECRET = 'test_jwt_secret_must_be_long_enough_and_secure';
process.env.NODE_ENV = 'test';

let server: Server;

const runTests = async () => {
  try {
    // 1. Connect to test database
    console.log('Connecting to test database...');
    await mongoose.connect(TEST_MONGODB_URI);
    console.log('Connected. Cleaning up test database...');
    await User.deleteMany({});

    // 2. Seed an Admin user (since they cannot register publicly)
    console.log('Seeding Admin user...');
    await User.create({
      name: 'Test Admin',
      email: 'admin@canteen.edu',
      password: 'SecureAdmin123', // Will be hashed automatically by pre-save hook
      role: 'admin',
    });

    // 3. Start server
    console.log(`Starting test server on http://${TEST_HOST}:${TEST_PORT}...`);
    server = app.listen(TEST_PORT, TEST_HOST);

    const baseUrl = `http://${TEST_HOST}:${TEST_PORT}/api`;

    // 4. Test Case 1: Register Student with weak password
    console.log('\n--- Test 1: Register Student with weak password (should fail) ---');
    const resWeakPass = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Student',
        email: 'weak@canteen.edu',
        password: 'weak', // fails minlength & regex
      }),
    });
    const dataWeakPass = await resWeakPass.json() as any;
    console.log(`Status: ${resWeakPass.status}`);
    console.log(`Message: ${dataWeakPass.message}`);
    if (resWeakPass.status !== 400) throw new Error('Test 1 failed!');

    // 5. Test Case 2: Register Student successfully
    console.log('\n--- Test 2: Register Student successfully ---');
    const resReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'student@canteen.edu',
        password: 'SecureStudent123',
      }),
    });
    const dataReg = await resReg.json() as any;
    console.log(`Status: ${resReg.status}`);
    console.log(`Message: ${dataReg.message}`);
    console.log(`Role: ${dataReg.user?.role}`);
    if (resReg.status !== 201) throw new Error('Test 2 failed!');

    // 6. Test Case 3: Register duplicate student
    console.log('\n--- Test 3: Register duplicate student (should fail) ---');
    const resDup = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student 2',
        email: 'student@canteen.edu',
        password: 'SecureStudent123',
      }),
    });
    const dataDup = await resDup.json() as any;
    console.log(`Status: ${resDup.status}`);
    console.log(`Message: ${dataDup.message}`);
    if (resDup.status !== 400) throw new Error('Test 3 failed!');

    // 7. Test Case 4: Login Student successfully
    console.log('\n--- Test 4: Login Student successfully ---');
    const resLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@canteen.edu',
        password: 'SecureStudent123',
      }),
    });
    const dataLogin = await resLogin.json() as any;
    console.log(`Status: ${resLogin.status}`);
    console.log(`Token received: ${!!dataLogin.token}`);
    if (resLogin.status !== 200 || !dataLogin.token) throw new Error('Test 4 failed!');
    const studentToken = dataLogin.token;

    // 8. Test Case 5: Login Admin successfully
    console.log('\n--- Test 5: Login Admin successfully ---');
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@canteen.edu',
        password: 'SecureAdmin123',
      }),
    });
    const dataAdminLogin = await resAdminLogin.json() as any;
    console.log(`Status: ${resAdminLogin.status}`);
    console.log(`Token received: ${!!dataAdminLogin.token}`);
    if (resAdminLogin.status !== 200 || !dataAdminLogin.token) throw new Error('Test 5 failed!');
    const adminToken = dataAdminLogin.token;

    // 9. Test Case 6: Access Student route with Student Token
    console.log('\n--- Test 6: Access Student Route with Student Token (should succeed) ---');
    const resStudRoute = await fetch(`${baseUrl}/test/student-only`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const dataStudRoute = await resStudRoute.json() as any;
    console.log(`Status: ${resStudRoute.status}`);
    console.log(`Message: ${dataStudRoute.message}`);
    if (resStudRoute.status !== 200) throw new Error('Test 6 failed!');

    // 10. Test Case 7: Access Admin route with Student Token
    console.log('\n--- Test 7: Access Admin Route with Student Token (should fail with 403) ---');
    const resAdminRouteFail = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const dataAdminRouteFail = await resAdminRouteFail.json() as any;
    console.log(`Status: ${resAdminRouteFail.status}`);
    console.log(`Message: ${dataAdminRouteFail.message}`);
    if (resAdminRouteFail.status !== 403) throw new Error('Test 7 failed!');

    // 11. Test Case 8: Access Admin route with Admin Token
    console.log('\n--- Test 8: Access Admin Route with Admin Token (should succeed) ---');
    const resAdminRoute = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminRoute = await resAdminRoute.json() as any;
    console.log(`Status: ${resAdminRoute.status}`);
    console.log(`Message: ${dataAdminRoute.message}`);
    if (resAdminRoute.status !== 200) throw new Error('Test 8 failed!');

    // 12. Test Case 9: Access without token
    console.log('\n--- Test 9: Access protected route without token (should fail with 401) ---');
    const resNoToken = await fetch(`${baseUrl}/test/student-only`);
    const dataNoToken = await resNoToken.json() as any;
    console.log(`Status: ${resNoToken.status}`);
    console.log(`Message: ${dataNoToken.message}`);
    if (resNoToken.status !== 401) throw new Error('Test 9 failed!');

    console.log('\n=====================================');
    console.log('ALL AUTH & RBAC INTEGRATION TESTS PASSED!');
    console.log('=====================================');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', (err as Error).message);
    process.exit(1);
  } finally {
    console.log('Cleaning up connections...');
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    console.log('Cleanup complete. Exiting.');
    process.exit(0);
  }
};

runTests();
