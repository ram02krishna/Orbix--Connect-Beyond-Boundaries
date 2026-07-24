import type { Request, Response } from "express";
import * as messageService from "../services/message.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { io } from "../server.js";
import { SOCKET_EVENTS } from "../sockets/events.js";
import { prisma } from "../config/prisma.js";

export async function sendNewMessage(req: Request, res: Response) {
  const { content, type, attachments } = req.body;
  const message = await messageService.sendMessage(
    req.params.chatId as string,
    req.user!.id,
    content,
    type,
    attachments
  );

  const chat = await prisma.chat.findUnique({
    where: { id: req.params.chatId as string },
    select: { members: { select: { userId: true } } },
  });

  if (chat) {
    for (const member of chat.members) {
      io.to(`user:${member.userId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
    }
  }

  sendSuccess(res, "Message sent", { message }, 201);
}

export async function fetchChatMessages(req: Request, res: Response) {
  const cursor = req.query.cursor as string | undefined;
  const limit = Number(req.query.limit) || 30;

  const messages = await messageService.getChatMessages(
    req.params.chatId as string,
    req.user!.id,
    cursor,
    limit
  );

  sendSuccess(res, "Messages fetched", { messages });
}
