"use client";

import { useFetch } from "@/lib/hooks";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { LinkMetadataResponse } from "@/app/api/link-metadata/route";
import { ResponsiveVideoPlayer, getYoutubeVideoFromUrl } from "./media-viewer";
import { SocketEvent, useSocketEmit } from "../socket/use-socket";

type Props = {
  link: string;
  messageId: string;
  topicId: string;
  onEmbedMediaLoad?: () => void;
};

export function LinkPreview(props: Props) {
  const { data, error } = useFetch<LinkMetadataResponse>({
    skip: props.link.includes("youtube.com"),
    url: `/api/link-metadata?url=${encodeURIComponent(props.link)}`,
    onSuccess: props.onEmbedMediaLoad,
  });

  const clickedLink = useSocketEmit<{ messageId: string; topicId: string }>(
    SocketEvent.UserClickedLink
  );

  if (error || !data) return null;

  return (
    <div className="hidden md:block">
      {data?.ogVideo && !getYoutubeVideoFromUrl(data?.ogVideo) && (
        <ResponsiveVideoPlayer
          src={data.ogVideo}
          onPreviewLoad={props.onEmbedMediaLoad}
        />
      )}
      <Link
        target="_blank"
        href={props.link}
        onClick={() => {
          clickedLink.emit({
            topicId: props.topicId,
            messageId: props.messageId,
          });
        }}
      >
        <Card className="my-2 hover:bg-secondary">
          <CardHeader className="p-4">
            {data ? (
              <>
                <div className="flex gap-3 items-start">
                  <div>
                    {data.ogImage ? (
                      <Avatar className="w-[160px] h-auto rounded-sm">
                        <AvatarImage
                          src={data.ogImage}
                          className="aspect-auto"
                        />
                      </Avatar>
                    ) : (
                      <Avatar className="rounded-sm w-12 h-12">
                        <AvatarFallback className="rounded-sm">
                          <ExternalLinkIcon />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="leading-snug flex flex-col font-semibold text-sm">
                      <div>{data.ogSiteName}</div>
                      <div>{data.ogTitle}</div>
                    </CardTitle>
                    {data.ogDescription && (
                      <CardDescription className="text-xs">
                        {data.ogDescription}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <PreviewLoader />
            )}
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}

function PreviewLoader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-1 items-center">
        <Skeleton className="h-9 w-9 rounded-sm shrink-0" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
