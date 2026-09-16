import { DropdownMenuItem } from "@watch3r/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@watch3r/ui/components/tooltip";
import { LoaderCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { formatDateTime } from "@/utils/dates";
import { trpc } from "@/utils/trpc";

const MINIMUM_HEALTH_CHECK_DURATION = 750;

export function ApiConnectionStatus() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const [isManuallyChecking, setIsManuallyChecking] = useState(false);
  const isChecking = healthCheck.isFetching || isManuallyChecking;
  const lastCheckedAt = Math.max(healthCheck.dataUpdatedAt, healthCheck.errorUpdatedAt);

  async function refetchHealthCheck() {
    setIsManuallyChecking(true);

    try {
      await Promise.all([
        healthCheck.refetch(),
        new Promise((resolve) => setTimeout(resolve, MINIMUM_HEALTH_CHECK_DURATION)),
      ]);
    } finally {
      setIsManuallyChecking(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => void refetchHealthCheck()}
          />
        }
      >
        <div className="flex items-center gap-2">
          {isChecking ? (
            <LoaderCircle className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <div className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}/>
          )}
          <span className="text-muted-foreground">
            {isChecking
                ? "Checking backend..."
                : healthCheck.data
                    ? "Connected"
                    : "Disconnected"
            }
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {lastCheckedAt ? `Last checked ${formatDateTime(lastCheckedAt)}` : "Not checked yet"}
      </TooltipContent>
    </Tooltip>
  );
}
