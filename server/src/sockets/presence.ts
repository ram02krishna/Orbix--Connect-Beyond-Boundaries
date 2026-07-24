import type { Server } from "socket.io";
import { redis } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { SOCKET_EVENTS } from "./events.js";

// get all user IDs that share a chat with the given user
async function getChatPartners(userId: string): Promise<string[]> {
  const cacheKey = `user:partners:${userId}`;
  const cached = await redis.get<string[]>(cacheKey);
  if (cached) return cached;

  const members = await prisma.chatMember.findMany({
    where: {
      chat: {
        members: { some: { userId } },
      },
      userId: { not: userId },
    },
    select: { userId: true },
  });

  const partners = [...new Set(members.map((m) => m.userId))];

  // cache for 5 minutes
  await redis.set(cacheKey, partners, { ex: 300 });
  return partners;
}

export async function handleUserConnect(userId: string, socketId: string, io: Server) {
  try {
    const connKey = `user:conn_count:${userId}`;
    const count = await redis.incr(connKey);

    // only mark online on first connection (handles multiple tabs)
    if (count === 1) {
      await redis.sadd("online_users", userId);

      const partners = await getChatPartners(userId);
      for (const partnerId of partners) {
        io.to(`user:${partnerId}`).emit(SOCKET_EVENTS.PRESENCE_CHANGE, {
          userId,
          status: "online",
        });
      }
    }

    // send current online statuses of all partners to this newly connected socket
    const partners = await getChatPartners(userId);
    const partnerStatuses = await getOnlineStatuses(partners);
    for (const [partnerId, statusObj] of Object.entries(partnerStatuses)) {
      io.to(socketId).emit(SOCKET_EVENTS.PRESENCE_CHANGE, {
        userId: partnerId,
        status: statusObj.status,
        lastSeen: statusObj.lastSeen,
      });
    }
  } catch (error) {
    console.error(`Error in handleUserConnect for user ${userId}:`, error);
  }
}

export async function handleUserDisconnect(userId: string, socketId: string, io: Server) {
  try {
    const connKey = `user:conn_count:${userId}`;
    const count = await redis.decr(connKey);

    // only mark offline if no more active connections
    if (count <= 0) {
      await redis.del(connKey);
      await redis.srem("online_users", userId);

      const lastSeen = new Date().toISOString();
      await redis.set(`user:last_seen:${userId}`, lastSeen);

      const partners = await getChatPartners(userId);
      for (const partnerId of partners) {
        io.to(`user:${partnerId}`).emit(SOCKET_EVENTS.PRESENCE_CHANGE, {
          userId,
          status: "offline",
          lastSeen,
        });
      }
    }
  } catch (error) {
    console.error(`Error in handleUserDisconnect for user ${userId}:`, error);
  }
}

export async function getOnlineStatuses(
  userIds: string[]
): Promise<Record<string, { status: "online" | "offline"; lastSeen?: string | null }>> {
  const statuses: Record<string, { status: "online" | "offline"; lastSeen?: string | null }> = {};

  try {
    for (const id of userIds) {
      const isOnline = await redis.sismember("online_users", id);
      let lastSeen: string | null = isOnline
        ? null
        : ((await redis.get(`user:last_seen:${id}`)) as string | null);

      if (!isOnline && !lastSeen) {
        const user = await prisma.user.findUnique({
          where: { id },
          select: { updatedAt: true },
        });
        if (user) {
          lastSeen = user.updatedAt.toISOString();
          await redis.set(`user:last_seen:${id}`, lastSeen);
        }
      }

      statuses[id] = {
        status: isOnline ? "online" : "offline",
        lastSeen: lastSeen || null,
      };
    }
  } catch (error) {
    console.error("Error fetching online statuses:", error);
  }

  return statuses;
}
