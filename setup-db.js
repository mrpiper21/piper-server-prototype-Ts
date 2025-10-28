import mongoose from 'mongoose';
import User, { UserRole } from './src/models/user.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printer-management');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'System Administrator',
      role: UserRole.ADMIN
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

    // Create default clerk user
    const clerkUser = new User({
      email: 'clerk@example.com',
      password: 'clerk123',
      name: 'Clerk User',
      role: UserRole.CLERK
    });

    await clerkUser.save();
    console.log('✅ Clerk user created successfully');
    console.log('Email: clerk@example.com');
    console.log('Password: clerk123');

    // Create default manager user
    const managerUser = new User({
      email: 'manager@example.com',
      password: 'manager123',
      name: 'Manager User',
      role: UserRole.MANAGER
    });

    await managerUser.save();
    console.log('✅ Manager user created successfully');
    console.log('Email: manager@example.com');
    console.log('Password: manager123');

    // Create default technician user
    const technicianUser = new User({
      email: 'technician@example.com',
      password: 'technician123',
      name: 'Technician User',
      role: UserRole.TECHNICIAN
    });

    await technicianUser.save();
    console.log('✅ Technician user created successfully');
    console.log('Email: technician@example.com');
    console.log('Password: technician123');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nDefault users created:');
    console.log('1. Admin: admin@example.com / admin123');
    console.log('2. Clerk: clerk@example.com / clerk123');
    console.log('3. Manager: manager@example.com / manager123');
    console.log('4. Technician: technician@example.com / technician123');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the setup
setupDatabase();
