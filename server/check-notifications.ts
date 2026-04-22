import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('=== Users ===');
  const users = await prisma.users.findMany({
    select: { id: true, username: true, realName: true },
    take: 10,
    orderBy: { id: 'asc' }
  });
  users.forEach(u => console.log(`ID: ${u.id}, Username: ${u.username}, Name: ${u.realName || 'N/A'}`));

  console.log('\n=== Recent Notifications (Last 10) ===');
  const notifications = await prisma.notifications.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      users_notifications_recipientIdTousers: {
        select: { id: true, username: true }
      },
      users_notifications_senderIdTousers: {
        select: { id: true, username: true }
      }
    }
  });

  if (notifications.length === 0) {
    console.log('No notifications found!');
  } else {
    notifications.forEach(n => console.log(
      `Type: ${n.type}, ` +
      `To: ${n.users_notifications_recipientIdTousers.username} (ID:${n.recipientId}), ` +
      `From: ${n.users_notifications_senderIdTousers?.username || 'System'} (ID:${n.senderId}), ` +
      `Title: ${n.title}, ` +
      `Created: ${n.createdAt}`
    ));
  }

  console.log('\n=== Recent Comment Mentions (Last 10) ===');
  const mentions = await prisma.comment_mentions.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, username: true } },
      comments: {
        select: {
          content: true,
          userId: true,
          users: { select: { username: true } }
        }
      }
    }
  });

  if (mentions.length === 0) {
    console.log('No mentions found!');
  } else {
    mentions.forEach(m => console.log(
      `Mentioned User: ${m.users.username} (ID:${m.userId}), ` +
      `Comment By: ${m.comments.users.username} (ID:${m.comments.userId}), ` +
      `Content: ${m.comments.content.substring(0, 50)}..., ` +
      `Created: ${m.createdAt}`
    ));
  }

  await prisma.$disconnect();
}

checkData().catch(console.error);
