import {userSelectSchema} from "@watch3r/db/schema/auth";
import {z} from "zod";
import {Avatar, AvatarBadge, AvatarFallback, AvatarImage} from "@watch3r/ui/components/avatar";
import {Check} from "lucide-react";
import {cn} from "@watch3r/ui/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "@watch3r/ui/components/tooltip";

export function MemberStack({users, showBadge = false, max = 4, size = 'sm'}: {
	users: z.infer<typeof userSelectSchema>[]
	showBadge?: boolean
	max?: number
	size?: "sm" | "md"
}) {
	const shown = users.slice(0, max);
	const extra = users.length - shown.length;
	const dim = size === "sm" ? "size-7 text-[11px]" : "size-8 text-xs"

	return (
		<div className="flex items-center -space-x-2">
			{shown.map((user) => (
				<Tooltip>
					<TooltipTrigger>
						<Avatar className={dim}>
							{user.image && <AvatarImage src="placeholder.svg"/>}
							<AvatarFallback>W3</AvatarFallback>
							{showBadge && (
								<AvatarBadge>
									<Check/>
								</AvatarBadge>
							)}
						</Avatar>
					</TooltipTrigger>
					<TooltipContent>
						<p>{user.name}</p>
					</TooltipContent>
				</Tooltip>
			))}

			{extra > 0 && (
				<span
					className={cn(
						"flex items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground ring-2 ring-card",
						dim
					)}
				>
					+{extra}
				</span>
			)}
		</div>
	)
}