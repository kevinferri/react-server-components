"use client";

import { useActiveCircleMembers } from "@/components/layouts/dashboard/active-circle-members-provider";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/lib/hooks";
import {
  CircleMember,
  useCurrentTopicContext,
} from "@/topics/current-topic-provider";
import keyBy from "lodash.keyby";

type MemberProps = {
  id: string;
  name: string;
  isOnline: boolean;
  imageUrl: string;
  isAdmin: boolean;
  createdAt?: Date;
};

function Member(props: MemberProps) {
  const { topicId } = useCurrentTopicContext();

  return (
    <div
      className={`flex gap-3 items-center ${
        props.isOnline ? "" : "opacity-40"
      }`}
    >
      <div className="relative">
        <UserAvatar
          id={props.id}
          topicId={topicId}
          name={props.name}
          imageUrl={props.imageUrl}
          variant={props.isOnline ? "default" : "idle"}
          createdAt={props.createdAt}
        />
        <div
          className={`absolute right-0 bottom-1.5 rounded-full h-3 w-3 border ${
            props.isOnline ? "bg-green-500" : "bg-slate-400"
          }`}
        />
      </div>

      <div>{props.name}</div>
      <div className="ml-auto">
        <Badge variant="secondary">{props.isAdmin ? "Admin" : "Member"}</Badge>
      </div>
    </div>
  );
}

type MembersWithStatus = (CircleMember & { isCreator: boolean })[];

export function CircleMembersList() {
  const { circleMembers, circleId } = useCurrentTopicContext();
  const { activeMembersByTopic } = useActiveCircleMembers();
  const debounced = useDebounce(activeMembersByTopic, 250);
  const allActiveMembers = debounced
    ? keyBy(Object.values(debounced).flat(), "id")
    : {};

  const onlineMembers: MembersWithStatus = [];
  const offlineMembers: MembersWithStatus = [];

  circleMembers.forEach((u) => {
    const isCreator = u.createdCircles.some(({ id }) => id === circleId);
    const isOnline = Boolean(allActiveMembers[u.id]);

    const user = {
      ...u,
      isCreator,
    };

    if (isOnline) {
      onlineMembers.push(user);
    } else {
      offlineMembers.push(user);
    }
  });

  const sortedOnlineMembers = [...onlineMembers].sort((user) => {
    if (user.isCreator) return -1;

    return 1;
  });

  return (
    <div className="px-3 pb-3 flex flex-col gap-3">
      <div className="text-sm flex items-center gap-1">
        Online ({sortedOnlineMembers.length})
      </div>
      {sortedOnlineMembers.map((user) => {
        return (
          <Member
            key={user.id}
            id={user.id}
            name={user.name ?? ""}
            imageUrl={user.imageUrl ?? ""}
            isOnline
            isAdmin={user.isCreator}
            createdAt={user.createdAt}
          />
        );
      })}

      <div className="text-sm mt-4">Offline ({offlineMembers.length})</div>
      {offlineMembers.map((user) => {
        return (
          <Member
            key={user.id}
            id={user.id}
            name={user.name ?? ""}
            imageUrl={user.imageUrl ?? ""}
            isOnline={false}
            isAdmin={user.isCreator}
            createdAt={user.createdAt}
          />
        );
      })}
    </div>
  );
}
