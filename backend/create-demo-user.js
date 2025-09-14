const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createUser() {
  const prisma = new PrismaClient();
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'john@example.com' }
    });
    
    if (existingUser) {
      console.log('Demo user already exists:', existingUser.email);
      await prisma.$disconnect();
      return;
    }
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      }
    });
    
    console.log('Demo user created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
