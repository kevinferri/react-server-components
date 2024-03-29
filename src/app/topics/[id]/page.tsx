import { DashboardLayout } from "@/components/layouts/dashboard/dashboard-layout";
import { prismaClient } from "@/lib/prisma/client";
import { TopicHeader } from "@/topics/topic-header";
import { TopicChat } from "@/topics/topic-chat";
import { TopicMessageBar } from "@/topics/topic-message-bar";
import { NotFound } from "@/components/ui/not-found";

type Props = {
  params: { id: string };
};

export default async function TopicsPage({ params }: Props) {
  const topic = await prismaClient.topic.getMeTopicById({
    topicId: params.id,
    select: {
      id: true,
      name: true,
      userId: true,
      description: true,
      parentCircle: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const messages = await prismaClient.message.getMessagesForTopic({
    topicId: topic?.id,
    select: {
      id: true,
      text: true,
      createdAt: true,
      highlights: {
        select: {
          id: true,
          userId: true,
        },
      },
      sentBy: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <DashboardLayout circleId={topic?.parentCircle.id} topicId={topic?.id}>
      {topic ? (
        <>
          <TopicHeader topic={topic} />
          <TopicChat
            topicId={topic.id}
            circleId={topic.parentCircle.id}
            existingMessages={messages}
          />
          <TopicMessageBar topicId={topic.id} />
        </>
      ) : (
        <NotFound copy="Topic not found" />
      )}
    </DashboardLayout>
  );
}
