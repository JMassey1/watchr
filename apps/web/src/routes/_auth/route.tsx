import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import {ThemePresetProvider} from "@/components/theme-provider";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    const userSettings = await context.queryClient.ensureQueryData(
        context.trpc.user.settings.queryOptions(),
    )

    return { session, userSettings };
  },
});

function AuthLayout() {
  const { userSettings } = Route.useRouteContext();
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
