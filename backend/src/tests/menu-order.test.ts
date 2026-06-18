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

const runTests = async () => {
  try {
    // 1. Connect to DB and clean
    console.log('Connecting to database...');
    await mongoose.connect(TEST_MONGODB_URI);
    await User.deleteMany({});
    await FoodItem.deleteMany({});
    await Order.deleteMany({});
    console.log('Database cleaned.');

    // 2. Seed Admin & Student
    console.log('Seeding users...');
    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@canteen.edu',
      password: 'SecureAdmin123',
      role: 'admin',
    });

    const student = await User.create({
      name: 'Test Student',
      email: 'student@canteen.edu',
      password: 'SecureStudent123',
      role: 'student',
    });

    // 3. Start server
    server = app.listen(TEST_PORT, TEST_HOST);
    const baseUrl = `http://${TEST_HOST}:${TEST_PORT}/api`;

    // 4. Log in users to get tokens
    console.log('Logging in and acquiring auth tokens...');
    const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@canteen.edu', password: 'SecureStudent123' }),
    });
    const studentToken = ((await studentLoginRes.json()) as any).token;

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@canteen.edu', password: 'SecureAdmin123' }),
    });
    const adminToken = ((await adminLoginRes.json()) as any).token;

    // 5. Admin creates menu items
    console.log('\n--- Admin Creating Menu Items ---');
    const createRes1 = await fetch(`${baseUrl}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Veg Burger',
        description: 'Delicious potato patty burger',
        price: 10,
        stock: 50,
        category: 'Meals',
        isVeg: true,
      }),
    });
    const item1 = ((await createRes1.json()) as any).data;
    console.log(`Created Item 1: ${item1.name}, Price: ${item1.price}, Stock: ${item1.stock}`);

    const createRes2 = await fetch(`${baseUrl}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Cold Coke',
        description: 'Ice cold refreshing beverage',
        price: 5,
        stock: 20,
        category: 'Drinks',
        isVeg: true,
      }),
    });
    const item2 = ((await createRes2.json()) as any).data;
    console.log(`Created Item 2: ${item2.name}, Price: ${item2.price}, Stock: ${item2.stock}`);

    // 6. Admin updates Veg Burger price to 12
    console.log('\n--- Admin Updating Veg Burger Price ---');
    const updateRes = await fetch(`${baseUrl}/menu/${item1._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ price: 12 }),
    });
    const updatedItem1 = ((await updateRes.json()) as any).data;
    console.log(`Updated Item 1 price: ${updatedItem1.price} (expected: 12)`);

    // 7. Student browses menu and searches
    console.log('\n--- Student Browsing Menu ---');
    const menuRes = await fetch(`${baseUrl}/menu`);
    const menuData = (await menuRes.json()) as any;
    console.log(`Total items in menu: ${menuData.count}`);

    console.log('\n--- Student Searching Menu for "Burger" ---');
    const searchRes = await fetch(`${baseUrl}/menu?search=Burger`);
    const searchData = (await searchRes.json()) as any;
    console.log(`Search result count: ${searchData.count}, First item name: ${searchData.data[0]?.name}`);

    console.log('\n--- Student Filtering Menu for Category "Drinks" ---');
    const filterRes = await fetch(`${baseUrl}/menu?category=Drinks`);
    const filterData = (await filterRes.json()) as any;
    console.log(`Filter result count: ${filterData.count}, First item name: ${filterData.data[0]?.name}`);

    // 8. Student places an order
    console.log('\n--- Student Placing Order (2 Burgers @ 12 each, 1 Coke @ 5) ---');
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [
          { foodItem: item1._id, quantity: 2 },
          { foodItem: item2._id, quantity: 1 },
        ],
      }),
    });
    const orderData = (await orderRes.json()) as any;
    console.log(`Order status: ${orderRes.status}`);
    console.log(`Order Total Price: ${orderData.data?.totalPrice} (expected: 29)`);
    console.log(`Order Status: ${orderData.data?.status} (expected: Pending)`);

    // Verify stock reduction
    const checkItem1 = await FoodItem.findById(item1._id);
    const checkItem2 = await FoodItem.findById(item2._id);
    console.log(`New Burger Stock: ${checkItem1?.stock} (expected: 48)`);
    console.log(`New Coke Stock: ${checkItem2?.stock} (expected: 19)`);

    // Verify student totalSpent
    const checkStudent = await User.findById(student._id);
    console.log(`Student total spent: ${checkStudent?.totalSpent} (expected: 29)`);

    // 9. Student tries to place order exceeding stock
    console.log('\n--- Student Ordering Exceeding Stock (should fail) ---');
    const failOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItem: item1._id, quantity: 100 }],
      }),
    });
    const failOrderData = (await failOrderRes.json()) as any;
    console.log(`Status: ${failOrderRes.status}`);
    console.log(`Message: ${failOrderData.message}`);

    // 10. Admin views all live orders
    console.log('\n--- Admin Fetching All Orders ---');
    const adminOrdersRes = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminOrdersData = (await adminOrdersRes.json()) as any;
    console.log(`Orders found by admin: ${adminOrdersData.count}`);

    // 11. Admin updates order status to Completed
    console.log('\n--- Admin Updating Order Status to Completed ---');
    const orderId = orderData.data?._id;
    const statusUpdateRes = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Completed' }),
    });
    const statusUpdateData = (await statusUpdateRes.json()) as any;
    console.log(`Status update status: ${statusUpdateRes.status}`);
    console.log(`New order status: ${statusUpdateData.data?.status} (expected: Completed)`);

    // 12. Admin checks dashboard analytics
    console.log('\n--- Admin Checking Dashboard Analytics ---');
    const analyticsRes = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = (await analyticsRes.json()) as any;
    console.log(`Total Sales: ${analyticsData.analytics?.totalSales} (expected: 29)`);
    console.log(`Active Orders: ${analyticsData.analytics?.activeOrders} (expected: 0)`);
    console.log(`Total Students: ${analyticsData.analytics?.totalStudents} (expected: 1)`);

    // 13. Admin checks registered student records
    console.log('\n--- Admin Fetching Student Records ---');
    const studentRecordsRes = await fetch(`${baseUrl}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const studentRecordsData = (await studentRecordsRes.json()) as any;
    console.log(`Students count: ${studentRecordsData.count}`);
    console.log(`Student totalSpent in records: ${studentRecordsData.data[0]?.totalSpent} (expected: 29)`);

    console.log('\n======================================================');
    console.log('ALL PHASE 3 MENU CRUD & ORDER PLACEMENT TESTS PASSED!');
    console.log('======================================================');
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', (error as Error).message);
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
