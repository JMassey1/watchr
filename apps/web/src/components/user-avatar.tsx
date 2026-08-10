import {publicUserSchema} from "@watch3r/db/schema/user";
import {z} from "zod";
import {Avatar, AvatarBadge, AvatarFallback, AvatarImage} from "@watch3r/ui/components/avatar";
import React from "react";
import {Check, LucideIcon} from "lucide-react";

export function UserAvatar({className, user, showBadge = false, badgeIcon = <Check />}: {
	className?: string
	showBadge?: boolean
	badgeIcon?: React.ReactNode
	user: z.infer<typeof publicUserSchema>
}) {
	return (
		<Avatar className={className}>
			{user.image && <AvatarImage src={user.image || 'placeholder.svg'} />}
			<AvatarFallback>{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
			{showBadge && (
				<AvatarBadge>
					{badgeIcon}
				</AvatarBadge>
			)}
		</Avatar>
	)
}