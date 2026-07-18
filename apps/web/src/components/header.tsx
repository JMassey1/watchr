import {Link} from "@tanstack/react-router";
import {Icon} from "@watch3r/ui/components/iconfiy-wrapper";

import {ModeToggle} from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [
		{to: "/", label: "Home"},
		{to: "/dashboard", label: "Dashboard"},
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg items-center">
					<Icon icon="f7:leaf-arrow-circlepath" className="size-9"/>
					<Link key="/dashboard" to="/dashboard" className="">
						Dashboard
					</Link>
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle/>
					<UserMenu/>
				</div>
			</div>
			<hr/>
		</div>
	);
}
