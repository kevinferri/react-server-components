import type { Message as DbMessage, Highlight, User } from "@prisma/client";
import { useSelf } from "@/components/auth/self-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SocketEvent, useSocketEmit } from "@/components/socket/use-socket";
import { HighlightTooltip } from "./highlight-tooltip";
import { useState } from "react";
import { Pencil2Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { DeleteMessageModal } from "./delete-message-modal";

export type Highlights = {
  id: Highlight["id"];
  userId: Highlight["userId"];
  createdBy: {
    imageUrl: User["imageUrl"];
  };
}[];

export type MessageProps = {
  id: DbMessage["id"];
  text?: DbMessage["text"];
  createdAt: DbMessage["createdAt"];
  sentBy: Pick<User, "id" | "name" | "imageUrl">;
  highlights: Highlights;
  topicId: string;
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((x) => x.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const baseStyles = [
  "z-0",
  "px-3 py-2",
  "relative",
  "leading-snug",
  "hover:bg-slate-50",
  "dark:hover:bg-slate-900",
  "after:content-['']",
  "after:h-full",
  "after:absolute",
  "after:left-[0]",
  "after:top-[0]",
  "after:w-[0]",
  "after:-z-10",
];

const highlightStyles = [
  "after:-z-10",
  "after:w-full",
  "after:bg-highlight",
  "dark:after:bg-yellow-600",
  "after:[transition:500ms]",
  "dark:text-secondary",
];

export const Message = (props: MessageProps) => {
  const self = useSelf();
  const [showActions, setShowActions] = useState(false);
  const sentBySelf = props.sentBy.id === self.id;
  const highlightedBySelf = !!props.highlights.find(
    (highlight) => self.id === highlight.userId
  );

  const toggleHighlight = useSocketEmit<{ messageId: string; topicId: string }>(
    SocketEvent.ToggleHighlight
  );

  const handleToggleHighlight = () => {
    toggleHighlight.emit({
      messageId: props.id,
      topicId: props.topicId,
    });
  };

  return (
    <div
      className={cn(baseStyles, highlightedBySelf ? highlightStyles : "")}
      onDoubleClick={handleToggleHighlight}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-2 items-center">
        <Avatar className="shadow-md">
          <AvatarImage
            className="rounded-full"
            src={props.sentBy.imageUrl ?? undefined}
          />
          <AvatarFallback>
            {getInitials(props.sentBy.name ?? undefined)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center">
            <span
              className={cn(
                `font-semibold ${
                  props.sentBy.id === self.id &&
                  "text-purple-700 dark:text-purple-500"
                }`
              )}
            >
              {props.sentBy.name}
            </span>
            <time className="text-slate-300 text-xs">
              {props.createdAt.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}
              {", "}
              {props.createdAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
              })}
            </time>
            {showActions && sentBySelf && (
              <div className="flex gap-1">
                <Button size="iconXs" variant="outline">
                  <Pencil2Icon />
                </Button>
                <DeleteMessageModal
                  messageId={props.id}
                  topicId={props.topicId}
                />
              </div>
            )}
          </div>

          <div className="whitespace-pre-line break-all">{props.text}</div>
        </div>

        <HighlightTooltip
          highlightedBySelf={highlightedBySelf}
          highlights={props.highlights}
          messageId={props.id}
          onHighlight={handleToggleHighlight}
        />
      </div>
    </div>
  );
};
