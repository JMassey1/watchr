import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@watch3r/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@watch3r/ui/components/dropdown-menu";
import { Skeleton } from "@watch3r/ui/components/skeleton";

import { authClient } from "@/lib/auth-client";
import {UserAvatar} from "@/components/user-avatar";
import {Settings, User} from "lucide-react";
import {queryClient} from "@/utils/trpc";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link to="/login" search={{ mode: "sign-in" }}>
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-foreground transition-colors hover:text-foreground" />}>
        <UserAvatar user={session.user} badgeIcon={<User className="size-4" />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/settings" />}>
            <Settings /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: async () => {
                    await navigate({
                      to: "/",
                    });
                    queryClient.clear();
                  },
                },
              });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
