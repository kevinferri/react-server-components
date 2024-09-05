"use client";

import { useState } from "react";
import {
  BellIcon,
  ImageIcon,
  PersonIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopHighlights } from "@/components/topics/top-highlights";
import { MediaList } from "@/components/topics/media-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleMembersList } from "@/components/topics/circle-members-list";
import { NotificationsList } from "@/components/topics/notifications-list";
import { useTopicNotifications } from "@/components/topics/use-topic-notifications";
import { Badge } from "@/components/ui/badge";

type Tab = "highlights" | "media" | "members" | "notifications";

export function TopicSideBar() {
  const [activeTab, setActiveTab] = useState<Tab>("highlights");
  const { notificationList, clearUnreadNotifications, unreadCount, asOf } =
    useTopicNotifications({
      skipIncrementUnread: activeTab === "notifications",
    });

  const tabMap: Record<Tab, Record<string, React.ReactElement | string>> = {
    highlights: {
      header: "Top highlights",
      node: <TopHighlights />,
      icon: <StarIcon />,
    },
    media: { header: "Media", node: <MediaList />, icon: <ImageIcon /> },
    members: {
      header: "Circle members",
      node: <CircleMembersList />,
      icon: <PersonIcon />,
    },
    notifications: {
      header: (
        <>
          Notifications{" "}
          <span className="text-muted-foreground text-sm">
            as of{" "}
            {asOf.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "numeric",
            })}
          </span>
        </>
      ),
      node: <NotificationsList notifications={notificationList} />,
      icon: (
        <div className="flex items-center gap-1.5 w-fu">
          <BellIcon />
          {activeTab !== "notifications" && unreadCount > 0 && (
            <Badge className="flex font-normal text-xs rounded-xl  hover:bg-succes px-2 bg-purple-500 min-w-7 justify-center">
              {unreadCount}
            </Badge>
          )}
        </div>
      ),
    },
  } as const;

  return (
    <Tabs
      defaultValue="highlights"
      className="flex flex-col shadow-md border-l max-w-[320px] min-w-[320px]"
      onValueChange={(tab) => {
        setActiveTab(tab as Tab);

        if (tab === "notifications") {
          clearUnreadNotifications();
        }
      }}
    >
      <div className="p-3">
        <TabsList className="grid w-full grid-cols-4 h-[38px]">
          {Object.keys(tabMap).map((tabKey) => {
            return (
              <TabsTrigger key={tabKey} value={tabKey}>
                {tabMap[tabKey as Tab].icon}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="flex flex-1 flex-col overflow-y-hidden basis-full">
        <div className="text-center py-1">{tabMap[activeTab].header}</div>
        <ScrollArea>{tabMap[activeTab].node}</ScrollArea>
      </div>
    </Tabs>
  );
}
