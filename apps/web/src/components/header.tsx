import {Link} from "@tanstack/react-router";
import {Icon} from "@watch3r/ui/components/iconfiy-wrapper";

import {ModeToggle} from "./mode-toggle";
import UserMenu from "./user-menu";
import {Button} from "@watch3r/ui/components/button";
import {Wrench} from "lucide-react";

export default function Header() {

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg items-center">
					<Link key="/" to="/">
						<Icon icon="f7:leaf-arrow-circlepath" className="size-9"/>
					</Link>
					<Link key="/dashboard" to="/dashboard" className="">
						Dashboard
					</Link>
				</nav>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:text-foreground">
						<Link to="/admin/dashboard">
							<Wrench className="size-4"/>
						</Link>
					</Button>
					<ModeToggle/>
					<UserMenu/>
				</div>
			</div>
			<hr/>
		</div>
	);
}
