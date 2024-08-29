import { useCallback, useEffect } from "react";
import { useSocketContext } from "@/components/socket/socket-provider";

export enum SocketEvent {
  SendMessage = "message:send",
  DeleteMessage = "message:delete",
  EditMessage = "message:edit",
  ShuffleGifMessage = "message:shuffleGif",

  JoinRoom = "room:join",
  LeaveRoom = "room:leave",

  UpsertedTopic = "topic:upserted",
  DeletedTopic = "topic:deleted",
  UserJoinedOrLeftTopic = "topic:userJoinedOrLeft",

  UpsertedCircle = "circle:upserted",
  DeletedCircle = "circle:deleted",
  UserJoinedCircle = "circle:userJoined",

  ToggleHighlight = "highlight:toggle",
  AddedHighlight = "highlight:added",
  RemovedHighlight = "highlight:removed",

  UserTabFocused = "user:tabFocused",
  UserTabBlurred = "user:tabBlurred",
  UserStartedTyping = "user:startedTyping",
  UserStoppedTyping = "user:stoppedTyping",
  UserExpandedImage = "user:expandedImage",

  CreateNotification = "notification:create",
}

export function useSocketHandler<T>(
  eventName: SocketEvent,
  handler: (args: T) => void,
  skip = false
) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (skip) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, handler, skip]);

  return socket;
}

export function useSocketEmit<T>(eventName: SocketEvent) {
  const { socket } = useSocketContext();

  const emit = useCallback(
    (payload: T) => {
      socket.emit(eventName, payload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventName]
  );

  return { emit };
}