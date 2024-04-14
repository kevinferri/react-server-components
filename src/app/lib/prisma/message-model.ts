import { Message, Prisma } from "@prisma/client";
import { getLoggedInUserId } from "@/lib/session";
import { prismaClient } from "@/lib/prisma/client";
import { decrypt } from "@/lib/decryption";

// type Message = Partial<
//   Prisma.MessageGetPayload<{
//     include: { highlights: true; question_type: true };
//   }>
// >;

type MessageArgs = {
  topicId?: string;
  select: Prisma.MessageSelect;
};

const MESSAGE_LIMIT = 50;
const TOP_HIGHLIGHTS_LIMIT = 10;
export const DEFAULT_MESSAGE_SELECT = {
  id: true,
  text: true,
  createdAt: true,
  topicId: true,
  highlights: {
    select: {
      id: true,
      userId: true,
      createdBy: {
        select: {
          imageUrl: true,
        },
      },
    },
  },
  sentBy: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
};

const normalizeMessages = (messages: Partial<Message>[]) =>
  messages.map((message) => ({
    ...message,
    text: getReadableMessage(message.text),
  }));

function getReadableMessage(text?: string | null) {
  if (!text) return undefined;

  try {
    return decrypt(text);
  } catch {
    return "";
  }
}

export const messageModel = {
  async getMessagesForTopic({ topicId, select }: MessageArgs) {
    const userId = getLoggedInUserId();
    if (!topicId || !userId) return [];

    const messages = await prismaClient.message.findMany({
      select,
      take: MESSAGE_LIMIT,
      where: { topicId },
      orderBy: {
        createdAt: "asc",
      },
    });

    return normalizeMessages(messages);
  },

  async getTopHighlightedMessagesForTopic({ topicId, select }: MessageArgs) {
    const userId = getLoggedInUserId();
    if (!topicId || !userId) return [];

    const messages = await prismaClient.message.findMany({
      select,
      where: { topicId },
      take: TOP_HIGHLIGHTS_LIMIT,
      orderBy: [
        {
          highlights: { _count: "desc" },
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return normalizeMessages(messages);
  },
};
