import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import {useSuspenseQuery} from "@tanstack/react-query";
import {trpc} from "@/utils/trpc";
import {ThemePresetProvider} from "@/components/theme-provider";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
  loader: ({context}) =>
      context.queryClient.ensureQueryData(
          context.trpc.user.settings.queryOptions(),
      ),
});

function AuthLayout() {
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

  return <AuthenticatedLayout />;
}

function AuthenticatedLayout() {
  const { data: userSettings } = useSuspenseQuery(
      trpc.user.settings.queryOptions(),
  );

  return (
      <>
        <ThemePresetProvider preset={userSettings.themePreset} />
        <Outlet />
      </>
  );
}
