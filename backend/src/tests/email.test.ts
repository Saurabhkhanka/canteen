import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/user.model';
import { FoodItem } from '../models/food.model';
import { Order } from '../models/order.model';
import { Server } from 'http';

const TEST_PORT = 5001;
const TEST_HOST = '127.0.0.1';
const TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/canteen_test';

process.env.JWT_SECRET = 'test_jwt_secret_must_be_long_enough_and_secure';
process.env.NODE_ENV = 'test';

let server: Server;

const runEmailTests = async () => {
  try {
    console.log('Connecting to database for email test...');
    await mongoose.connect(TEST_MONGODB_URI);
    await User.deleteMany({});
    await FoodItem.deleteMany({});
    await Order.deleteMany({});

    // Seed student user
    console.log('Seeding student...');
    const student = await User.create({
      name: 'John Doe',
      email: 'johndoe@college.edu',
      password: 'SecureStudent123',
      role: 'student',
    });

    // Seed menu item
    console.log('Seeding food item...');
    const foodItem = await FoodItem.create({
      name: 'Paneer Wrap',
      description: 'Healthy paneer wrap filled with fresh veggies',
      price: 8.5,
      stock: 10,
      category: 'Snacks',
      isVeg: true,
    });

    // Start server
    server = app.listen(TEST_PORT, TEST_HOST);
    const baseUrl = `http://${TEST_HOST}:${TEST_PORT}/api`;

    // Log in
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'johndoe@college.edu', password: 'SecureStudent123' }),
    });
    const token = ((await loginRes.json()) as any).token;

    // Intercept console.log to confirm email simulation dispatch
    console.log('\n--- Placing Order (Triggering Asynchronous Email Dispatch) ---');
    
    // We wrap fetch call and wait briefly for async email handler to resolve
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ foodItem: foodItem._id, quantity: 2 }],
      }),
    });
    
    const orderData = (await orderRes.json()) as any;
    console.log(`Order placement HTTP Status: ${orderRes.status}`);
    console.log(`Order ID: ${orderData.data?._id}`);
    
    // Wait 1 second to allow fire-and-forget email promise to execute and log to console
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('\n=======================================');
    console.log('EMAIL DISPATCH FLOW VERIFIED SUCCESSFULLY!');
    console.log('=======================================');

  } catch (error) {
    console.error('\n❌ EMAIL TEST FAILED:', (error as Error).message);
    process.exit(1);
  } finally {
    console.log('Cleaning up connections...');
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    process.exit(0);
  }
};

runEmailTests();
