"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Circle } from "@prisma/client";
import { useSelf } from "@/components/auth/self-provider";
import { toast } from "@/components/ui/use-toast";
import {
  SocketEvent,
  useSocketEmit,
  useSocketHandler,
} from "@/components/socket/use-socket";
import { ToastAction } from "@/components/ui/toast";
import { useParams, useRouter } from "next/navigation";
import { getInitials, UserAvatar } from "@/components/shared/user-avatar";
import { useActiveCircleMembers } from "@/components/layouts/dashboard/active-circle-members-provider";

type Props = {
  existingCircles?: Circle[];
};

type NewCircleHandlerProps = {
  id: string;
  defaultTopicId?: string;
  name: string;
  isEdit: boolean;
  prevMembers: string[];
  members: string[];
  createdBy: {
    name: string;
    id: string;
  };
};

type DeletedCircleHandlerProps = {
  id: string;
  name: string;
  members: string[];
  deletedBy: {
    name: string;
    id: string;
  };
};

export function CirclesList(props: Props) {
  const self = useSelf();
  const router = useRouter();
  const params = useParams();
  const { topicMap } = useActiveCircleMembers();
  const joinRoom = useSocketEmit(SocketEvent.JoinRoom);
  const activeMembersByCircle = useMemo(() => {
    if (!topicMap) return undefined;

    return Object.values(topicMap).reduce((acc, cur) => {
      return {
        ...acc,
        [cur.circleId]: {
          circleId: cur.circleId,
          activeUsers: [
            ...(acc[cur.circleId]?.activeUsers ?? []),
            ...cur.activeUsers,
          ],
        },
      };
    }, {} as typeof topicMap);
  }, [topicMap]);

  useSocketHandler<NewCircleHandlerProps>(
    SocketEvent.UpsertedCircle,
    (payload) => {
      router.refresh();

      const createdBySelf = payload.createdBy.id === self.id;
      const name = createdBySelf ? "You" : payload.createdBy.name;
      const isInCircle = payload.members.includes(self.id);
      const wasInCircle = payload.prevMembers.includes(self.id);
      const link = `/circles/${payload.id}/topics/${payload.defaultTopicId}`;

      if (!payload.isEdit) {
        joinRoom.emit({ id: payload.id, roomType: "circle" });
      }

      if (payload.isEdit && createdBySelf) return;
      if (wasInCircle && !isInCircle) return;

      if (!payload.isEdit || (isInCircle && !wasInCircle)) {
        toast({
          title: `New circle created`,
          description: `${name} created a new circle called "${payload.name}"`,
          action: (
            <ToastAction
              altText="Go there now"
              onClick={() => {
                router.push(link);
              }}
            >
              Go there now
            </ToastAction>
          ),
        });
      }
    }
  );

  useSocketHandler<DeletedCircleHandlerProps>(
    SocketEvent.DeletedCircle,
    (payload) => {
      router.refresh();

      const deletedBySelf = payload.deletedBy.id === self.id;
      const name = deletedBySelf ? "You" : payload.deletedBy.name;

      toast({
        title: `Circle deleted`,
        description: `${name} deleted the circle called "${payload.name}"`,
      });
    }
  );

  return (
    <>
      {props.existingCircles?.map((circle) => {
        const activeUsers =
          activeMembersByCircle?.[circle.id]?.activeUsers ?? [];

        return (
          <TooltipProvider key={circle.id}>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <Link
                  href={`/circles/${circle.id}/topics/${circle.defaultTopicId}`}
                  className="relative"
                >
                  <Avatar
                    className={`hover:opacity-70 ${
                      params.circleId === circle.id
                        ? "border shadow-[0_0_1px_white,inset_0_0_1px_white,0_0_2px_#9333ea,0_0_5px_#9333ea,0_0_10px_#9333ea]"
                        : "shadow-md"
                    }`}
                  >
                    <AvatarImage
                      src={circle.imageUrl ?? undefined}
                      alt={circle.name}
                    />
                    <AvatarFallback>
                      <div className="mt-[1.5px]">
                        {getInitials(circle.name)}
                      </div>
                    </AvatarFallback>
                  </Avatar>
                  {activeUsers.length > 0 && (
                    <div className="absolute top-[-7px] right-[-3px] w-[18px] h-[18px] text-[11px] rounded-full bg-purple-500 text-slate-100 flex items-center justify-center">
                      {activeUsers.length}
                    </div>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="p-2">
                <div className="flex flex-col gap-2">
                  <div className="text-sm leading-none">{circle.name}</div>
                  {activeUsers.length > 0 && (
                    <div className="flex gap-1">
                      {activeUsers.map((user) => {
                        return (
                          <UserAvatar
                            key={user.id}
                            id={user.id}
                            name={user.name}
                            imageUrl={user.imageUrl}
                            createdAt={user.createdAt}
                            size="xs"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </>
  );
}
