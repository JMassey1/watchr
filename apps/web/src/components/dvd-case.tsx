import {useState} from "react";
import {motion, useReducedMotion} from "motion/react";

export type DvdCaseProps = {
	posterUrl: string;
	posterAlt: string;
	title: string;
	subtitle: string;
	description: string;
	metadata: readonly string[];
};

const CASE_WIDTH_PX = 300;
const CASE_HEIGHT_PX = 430;
const SPINE_WIDTH_PX = 16;
const PERSPECTIVE_PX = 1600;
const OPEN_ROTATION_DEG = -105;
const SPINE_PREVIEW_ROTATION_DEG = 8;
// Motion spring configuration values (stiffness/damping/mass), not CSS dimension units.
const SPRING = {type: "spring" as const, stiffness: 120, damping: 22, mass: 0.9};

export default function DvdCase({
	posterUrl,
	posterAlt,
	title,
	subtitle,
	description,
	metadata,
}: DvdCaseProps) {
	const [open, setOpen] = useState(false);
	const reduceMotion = useReducedMotion();

	const toggle = () => setOpen((v) => !v);

	return (
		<div
			className="flex w-full justify-center"
			style={{perspective: PERSPECTIVE_PX}}
		>
			<motion.div
				className="relative transform-3d"
				style={{width: `min(100%, ${CASE_WIDTH_PX}px)`, aspectRatio: `${CASE_WIDTH_PX} / ${CASE_HEIGHT_PX}`}}
				initial={false}
				whileHover={open || reduceMotion ? undefined : {rotateY: SPINE_PREVIEW_ROTATION_DEG}}
				transition={reduceMotion ? {duration: 0} : SPRING}
			>
				{/* Stationary inside / back panel, positioned on the right */}
				<aside
					aria-hidden={open ? undefined : true}
					className="absolute inset-0 overflow-hidden rounded-r-md rounded-l-sm border border-black/30 bg-neutral-900 backface-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.6),0_12px_24px_-8px_rgba(0,0,0,0.7)]"
				>
					{/* Spine running down the left edge of the body */}
					<div
						className="absolute left-0 top-0 h-full bg-linear-to-r from-neutral-800 via-neutral-700 to-neutral-800"
					style={{width: SPINE_WIDTH_PX}}
				/>
				{/* Interior content sits to the right of the spine */}
				<div
					className="flex h-full flex-col justify-between p-4"
					style={{paddingLeft: SPINE_WIDTH_PX + 12}}
					>
						<div className="space-y-1">
							<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
								Disc
							</p>
							<h3 className="font-semibold leading-tight text-neutral-100">
								{title}
							</h3>
							{subtitle ? (
								<p className="text-xs text-neutral-400">{subtitle}</p>
							) : null}
						</div>

						{/* Disc */}
						<div className="flex justify-center">
							<div
								className="relative rounded-full bg-linear-to-br from-neutral-200 via-neutral-400 to-neutral-700 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
								style={{width: 150, height: 150}}
							>
								<div className="absolute inset-3 rounded-full border border-neutral-500/40" />
								<div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900 ring-2 ring-neutral-500/60" />
								<div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_55%)]" />
							</div>
						</div>

						<div className="space-y-2">
							{description ? (
								<p className="text-[11px] leading-relaxed text-neutral-300">
									{description}
								</p>
							) : null}
							{metadata.length > 0 ? (
								<ul className="flex flex-wrap gap-1.5">
									{metadata.map((item) => (
										<li
											key={item}
											className="rounded-full border border-neutral-600/50 bg-neutral-800/60 px-2 py-0.5 text-[10px] text-neutral-300"
										>
											{item}
										</li>
									))}
								</ul>
							) : null}
						</div>
					</div>
				</aside>

				{/* Front cover — swings left around its left-center Y hinge */}
				<motion.button
					type="button"
					onClick={toggle}
					aria-label={`${open ? "Close" : "Open"} DVD case for ${title}`}
					aria-expanded={open}
					className="absolute inset-0 origin-left rounded-r-md rounded-l-sm border border-black/40 bg-black transform-3d focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
					style={{transformOrigin: "left center"}}
					initial={false}
					animate={{rotateY: open ? OPEN_ROTATION_DEG : 0}}
					transition={reduceMotion ? {duration: 0} : SPRING}
				>
					{/* Front face: poster + plastic edging + lighting */}
					<div
						className="absolute inset-0 overflow-hidden rounded-r-md rounded-l-sm backface-hidden"
						style={{boxShadow: "0 14px 30px -10px rgba(0,0,0,0.75)"}}
					>
						<img
							src={posterUrl}
							alt={posterAlt}
							className="h-full w-full object-cover"
							draggable={false}
						/>
						{/* Plastic edging */}
						<div className="pointer-events-none absolute inset-0 rounded-r-md rounded-l-sm ring-1 ring-inset ring-white/10" />
						<div className="pointer-events-none absolute inset-0 rounded-r-md rounded-l-sm ring-1 ring-inset ring-black/30" />
						{/* Spine strip on the left edge of the cover */}
						<div
							className="pointer-events-none absolute left-0 top-0 h-full bg-linear-to-r from-black/50 via-black/20 to-transparent"
					style={{width: SPINE_WIDTH_PX}}
					/>
					{/* Specular highlight */}
						<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.12)_100%)]" />
						<div className="pointer-events-none absolute -inset-x-4 -top-10 h-20 rotate-[-8deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.35),transparent)] blur-md" />
					</div>

					{/* Back face: inside of the front cover (visible when open) */}
					<div
						className="absolute inset-0 flex flex-col justify-end gap-1 rounded-r-md rounded-l-sm bg-neutral-900 p-4 backface-hidden transform-[rotateY(180deg)]"
						style={{paddingLeft: SPINE_WIDTH_PX + 12}}
					>
						<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.04),transparent_40%)]" />
						<p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
							Inside cover
						</p>
						<p className="text-xs text-neutral-400">{title}</p>
					</div>

				</motion.button>

				{/* Case base shadow */}
				<div
					className="absolute -bottom-3 left-1/2 h-4 w-[85%] -translate-x-1/2 rounded-[50%] bg-black/50 blur-md"
					aria-hidden={true}
				/>
			</motion.div>
		</div>
	);
}
