import {Icon as Iconify, type IconProps} from "@iconify/react";
import {cn} from "@watch3r/ui/lib/utils";

export function Icon({className, ...props}: IconProps) {
	return (
		<Iconify
			className={cn("size-4 shrink-0", className)}
			{...props}
		/>
	)
}