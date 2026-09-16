import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import {ThemePresetProvider} from "@/components/theme-provider";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    const result = await authClient.getSession();
    const session = result.data;

    if (!session) {
      throw redirect({
        to: "/login",
      });
    }

    return { session };
  },
});

function AuthLayout() {
  const { data: userSettings } = useSuspenseQuery(trpc.user.settings.queryOptions());
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      void navigate({ to: "/login" });
    }
  }, [isPending, navigate, session]);
  if (isPending || !session) {
    return null;
  }

  return (
      <>
        <ThemePresetProvider preset={userSettings.themePreset} />
        <Outlet />
      </>
  );
}
