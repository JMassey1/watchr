import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
