import Link from "next/link";
import { StaticRoutes } from "@/static-routes";
import { UpsertCircleForm } from "@/components/circles/upsert-circle-form";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserDropDown } from "@/components/ui/user-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CirclesList } from "@/components/circles/circles-list";
import { Circle } from "@prisma/client";

type Props = {
  circles?: Circle[];
};

export const CirclesNav = async ({ circles }: Props) => {
  return (
    <div className="flex flex-col border-r">
      <div className="flex flex-col items-center px-3 py-2">
        <Link href={StaticRoutes.Home} className="hover:opacity-80">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/assets/logo.svg" />
          </Avatar>
        </Link>
      </div>

      <ScrollArea>
        <div className="flex flex-col gap-3 p-3">
          <CirclesList existingCircles={circles} />
          <UpsertCircleForm />
        </div>
      </ScrollArea>

      <div className="flex flex-col items-center mt-auto gap-3 px-3 py-2">
        <ThemeToggle />
        <UserDropDown />
      </div>
    </div>
  );
};
