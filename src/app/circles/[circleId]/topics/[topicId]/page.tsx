import { cache } from "react";
import { prismaClient } from "@/lib/prisma/client";
import { TopicHeader } from "@/components/topics/topic-header";
import { TopicChat } from "@/components/topics/topic-chat";
import { TopicMessageBar } from "@/components/topics/topic-message-bar";
import { NotFound } from "@/components/dashboard/not-found";
import { TopicSideBar } from "@/components/topics/topic-side-bar";
import {
  DEFAULT_MESSAGE_SELECT,
  MESSAGE_LIMIT,
  TOP_HIGHLIGHTS_LIMIT,
} from "@/lib/prisma/message-model";
import { CurrentTopicProvider } from "@/components/topics/current-topic-provider";
import { DEFAULT_TITLE } from "@/app/layout";
import { MessageModal } from "@/components/topics/message-modal";

type Props = {
  params: Promise<{ topicId: string; circleId: string }>;
};

const getTopic = cache(async (topicId: string, circleId: string) => {
  const topic = await prismaClient.topic.getMeTopicByIdWithCircle({
    topicId,
    circleId,
    select: {
      id: true,
      name: true,
      userId: true,
      description: true,
      parentCircle: {
        select: {
          id: true,
          name: true,
          defaultTopicId: true,
        },
      },
    },
  });

  return topic;
});

export async function generateMetadata({ params }: Props) {
  const { topicId, circleId } = await params;
  const topic = await getTopic(topicId, circleId);

  return {
    title: !topic
      ? DEFAULT_TITLE
      : `${topic.parentCircle.name} - ${topic.name}`,
  };
}

export default async function TopicPage({ params }: Props) {
  const { topicId, circleId } = await params;
  const topic = await getTopic(topicId, circleId);

  const queries = [
    prismaClient.message.getMessagesForTopic({
      topicId: topic?.id,
      select: DEFAULT_MESSAGE_SELECT,
    }),

    prismaClient.message.getTopHighlightedMessagesForTopic({
      topicId: topic?.id,
      select: DEFAULT_MESSAGE_SELECT,
      since: "month",
    }),

    prismaClient.message.getMediaMessagesForTopic({
      topicId: topic?.id,
      select: DEFAULT_MESSAGE_SELECT,
    }),

    prismaClient.user.getMembersForCircle({
      circleId: topic?.parentCircle.id ?? "",
      select: {
        id: true,
        name: true,
        imageUrl: true,
        createdAt: true,
        status: true,
        lastStatusUpdate: true,
        createdCircles: {
          select: {
            id: true,
          },
        },
      },
    }),
  ];

  const [messages, topHighlights, mediaMessages, circleMembers] =
    await Promise.all(queries);

  return (
    <div className="flex flex-col overflow-y-auto basis-full h-full">
      {topic ? (
        <CurrentTopicProvider
          topicId={topic.id}
          circleId={topic.parentCircle.id}
          messagesLimit={MESSAGE_LIMIT}
          topicName={topic.name}
          circleName={topic.parentCircle.name}
          topHighlightsLimit={TOP_HIGHLIGHTS_LIMIT}
          // @ts-expect-error
          existingCircleMemebers={circleMembers}
          // @ts-expect-error
          existingMessages={messages}
          // @ts-expect-error
          existingTopHighlights={topHighlights}
          // @ts-expect-error
          existingMediaMessages={mediaMessages}
        >
          <TopicHeader topic={topic} />
          <div className="flex flex-1 flex-row overflow-y-hidden">
            <div className="flex flex-1 flex-col overflow-x-hidden">
              <MessageModal />
              <TopicChat />
              <TopicMessageBar />
            </div>
            <div className="flex overflow-y-hidden">
              <TopicSideBar topicId={topic.id} />
            </div>
          </div>
        </CurrentTopicProvider>
      ) : (
        <NotFound copy="Topic not found" />
      )}
    </div>
  );
}
