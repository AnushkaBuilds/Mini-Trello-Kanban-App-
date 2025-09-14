import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash a default password for seed users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
    }
  });

  console.log('✅ Users created');

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      description: 'Main workspace for Acme Corporation',
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: 'owner' },
          { userId: user2.id, role: 'member' }
        ]
      }
    }
  });

  console.log('✅ Workspace created');

  // Create labels
  const labels = await Promise.all([
    prisma.label.create({
      data: { name: 'Bug', color: '#e74c3c' }
    }),
    prisma.label.create({
      data: { name: 'Feature', color: '#2ecc71' }
    }),
    prisma.label.create({
      data: { name: 'High Priority', color: '#f39c12' }
    }),
    prisma.label.create({
      data: { name: 'In Progress', color: '#3498db' }
    }),
    prisma.label.create({
      data: { name: 'Done', color: '#95a5a6' }
    })
  ]);

  console.log('✅ Labels created');

  // Create board
  const board = await prisma.board.create({
    data: {
      title: 'Product Development',
      description: 'Main board for product development tasks',
      visibility: 'workspace',
      workspaceId: workspace.id,
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: 'owner' },
          { userId: user2.id, role: 'member' }
        ]
      }
    }
  });

  console.log('✅ Board created');

  // Create lists
  const todoList = await prisma.list.create({
    data: {
      title: 'To Do',
      position: 1000,
      boardId: board.id
    }
  });

  const inProgressList = await prisma.list.create({
    data: {
      title: 'In Progress',
      position: 2000,
      boardId: board.id
    }
  });

  const doneList = await prisma.list.create({
    data: {
      title: 'Done',
      position: 3000,
      boardId: board.id
    }
  });

  console.log('✅ Lists created');

  // Create cards
  const card1 = await prisma.card.create({
    data: {
      title: 'Implement user authentication',
      description: 'Set up JWT-based authentication system with login/signup functionality',
      position: 1000,
      listId: todoList.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignments: {
        create: { userId: user1.id }
      },
      labels: {
        create: [
          { labelId: labels[1].id }, // Feature
          { labelId: labels[2].id }  // High Priority
        ]
      }
    }
  });

  const card2 = await prisma.card.create({
    data: {
      title: 'Design database schema',
      description: 'Create comprehensive database schema for the application',
      position: 2000,
      listId: inProgressList.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      assignments: {
        create: { userId: user2.id }
      },
      labels: {
        create: [
          { labelId: labels[1].id }, // Feature
          { labelId: labels[3].id }  // In Progress
        ]
      }
    }
  });

  const card3 = await prisma.card.create({
    data: {
      title: 'Fix login bug',
      description: 'Users are unable to login with special characters in password',
      position: 1000,
      listId: doneList.id,
      assignments: {
        create: { userId: user1.id }
      },
      labels: {
        create: [
          { labelId: labels[0].id }, // Bug
          { labelId: labels[4].id }  // Done
        ]
      }
    }
  });

  console.log('✅ Cards created');

  // Create comments
  await prisma.comment.create({
    data: {
      text: 'This looks good, but we need to consider edge cases for password validation.',
      cardId: card1.id,
      authorId: user2.id
    }
  });

  await prisma.comment.create({
    data: {
      text: 'I\'ll start working on this tomorrow morning.',
      cardId: card1.id,
      authorId: user1.id
    }
  });

  await prisma.comment.create({
    data: {
      text: 'The schema looks comprehensive. Should we add indexes for better performance?',
      cardId: card2.id,
      authorId: user1.id
    }
  });

  console.log('✅ Comments created');

  // Create activities
  await prisma.activity.create({
    data: {
      type: 'card_created',
      data: JSON.stringify({ cardId: card1.id, cardTitle: card1.title }),
      cardId: card1.id,
      boardId: board.id,
      userId: user1.id
    }
  });

  await prisma.activity.create({
    data: {
      type: 'card_created',
      data: JSON.stringify({ cardId: card2.id, cardTitle: card2.title }),
      cardId: card2.id,
      boardId: board.id,
      userId: user2.id
    }
  });

  await prisma.activity.create({
    data: {
      type: 'card_moved',
      data: { 
        cardId: card3.id, 
        fromListId: inProgressList.id, 
        toListId: doneList.id,
        fromListTitle: inProgressList.title,
        toListTitle: doneList.title
      },
      cardId: card3.id,
      boardId: board.id,
      userId: user1.id
    }
  });

  await prisma.activity.create({
    data: {
      type: 'comment_added',
      data: { cardId: card1.id, commentText: 'This looks good, but we need to consider edge cases for password validation.' },
      cardId: card1.id,
      boardId: board.id,
      userId: user2.id
    }
  });

  console.log('✅ Activities created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Created:');
  console.log(`- 2 users (${user1.email}, ${user2.email})`);
  console.log(`- 1 workspace (${workspace.name})`);
  console.log(`- 5 labels`);
  console.log(`- 1 board (${board.title})`);
  console.log(`- 3 lists`);
  console.log(`- 3 cards`);
  console.log(`- 3 comments`);
  console.log(`- 4 activities`);
  console.log('\n🔑 Login credentials:');
  console.log('User 1: john@example.com (any password)');
  console.log('User 2: jane@example.com (any password)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
