import EventCard from "@/components/shared/EventCard";
import EventCards from "@/components/shared/EventCards";
import LikeCartButton from "@/components/shared/LikeCartButton";
import NoResults from "@/components/shared/NoResults";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventById, getRelatedEvents } from "@/lib/actions/event.action";
import { getUserByClerkId } from "@/lib/actions/user.action";
import { checkUserRegistration } from "@/lib/actions/order.action";
import { dateConverter, timeFormatConverter } from "@/lib/utils";
import { auth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { headers } from "next/headers";
import RaiseIssueButton from "@/components/shared/RaiseIssueButton";

interface Props {
	params: Promise<{ id: string }>;
}

const Page = async ({ params }: Props) => {
	// ✅ FIX: Await headers() and params at the top for Next.js 15 compatibility
	await headers();
	const awaitedParams = await params;

	// ✅ Await auth() to avoid header issues in Next.js 15
	const { userId } = await auth();
	let user = null;
	let likedEvent = false;
	let isRegistered = false;

	if (userId) {
		user = await getUserByClerkId(userId);
		if (user) {
			likedEvent = user.likedEvents.includes(awaitedParams.id);
			// Check if user is registered for this event
			isRegistered = await checkUserRegistration({
				userId: user._id,
				eventId: awaitedParams.id,
			});
		}
	}

	const event = await getEventById(awaitedParams.id);

	if (!event) {
		return <NoResults title="Event not found" desc="The event you are looking for does not exist." link="/" linkTitle="Go Home" />;
	}

	const relatedEvents = !event.parentEvent ? await getRelatedEvents(awaitedParams.id) : [];

	// Check if current user is the organizer
	const isOrganizer = user && String(event.organizer._id) === String(user._id);

	return (
		<div className="font-medium md:mx-24">
			{event.photo && (
				<div className="rounded-md md:h-[500px] flex justify-center items-center">
					<Image
						src={event.photo}
						alt={event.title}
						width={1920}
						height={1800}
						priority={true}
						className="rounded-md w-full h-full object-contain"
					/>
				</div>
			)}
			<div className="flex flex-col gap-5">
				<h2 className="text-4xl max-sm:text-2xl mt-3">
					{event.parentEvent ? 'Sub-Event: ' : ''}{event.title}
				</h2>

				<div className="flex max-sm:flex-wrap justify-left max-sm:justify-betwee items-center gap-3">
					<Badge className="text-base">
						{event.isFree ? `Free` : `₹ ${event.price}`}
					</Badge>
					<Badge
						className="text-base"
						variant={"secondary"}
					>
						{(event.category as any)?.name || 'Uncategorized'}
					</Badge>
					<Badge
						className="text-base"
						variant={"secondary"}
					>{`By ${(event.organizer as any)?.firstName || ''} ${(event.organizer as any)?.lastName || ''}`}</Badge>
				</div>

				{/* Action buttons based on user relationship to event */}
				<div className="flex flex-wrap gap-3">
					{!userId ? (
						// Show login prompt for non-authenticated users
						<div className="flex flex-wrap gap-3">
							<Button asChild size="lg" variant="outline">
								<Link href="/sign-in">
									Sign In to Register
								</Link>
							</Button>
							<LikeCartButton
								event={JSON.parse(JSON.stringify(event))}
								user={JSON.parse(JSON.stringify(user))}
								likedEvent={likedEvent}
								option="eventPage"
							/>
						</div>
					) : isOrganizer ? (
						// Show Manage Event button for organizers
						<Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
							<Link href={`/event/${event._id}/manage`}>
								⚙️ Manage Event
							</Link>
						</Button>
					) : isRegistered ? (
						// Show Report Issue button for registered users
						<RaiseIssueButton
							event={JSON.parse(JSON.stringify(event))}
							currentUserId={userId}
							variant="outline"
							size="lg"
							className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
						/>
					) : (
						// Show registration/booking button for non-registered users
						<LikeCartButton
							event={JSON.parse(JSON.stringify(event))}
							user={JSON.parse(JSON.stringify(user))}
							likedEvent={likedEvent}
							option="eventPage"
						/>
					)}
				</div>

				<div className="flex flex-wrap gap-3">
					<div>
						{new Date(event.endDate) > new Date(event.startDate)
							? `${dateConverter(
								event.startDate.toString()
							)} - ${dateConverter(event.endDate.toString())}`
							: `${dateConverter(event.startDate.toString())}`}
					</div>
					&nbsp;
					<div>
						{timeFormatConverter(event.startTime)} -{" "}
						{timeFormatConverter(event.endTime)}
					</div>
				</div>

				<div>
					{event.isOnline ? "Online Event" : `${event.location}`}
				</div>

				<div>{event.description}</div>

				{event.url && (
					<Link
						href={event.url}
						className="text-blue-700 "
					>
						{event.url}
					</Link>
				)}

				{/* Additional info for registered users */}
				{isRegistered && !isOrganizer && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
						<h3 className="text-lg font-semibold text-blue-800 mb-2">You're Registered!</h3>
						<p className="text-blue-600 text-sm">
							You have successfully registered for this event. If you encounter any issues, please use the "Report Issue" button above.
						</p>
					</div>
				)}

				<div className="flex flex-wrap gap-3 mb-8">
					{event.tags?.map((tag: any) => {
						return (
							<Badge
								key={tag.name}
								variant={"secondary"}
								className=""
							>
								{tag.name}
							</Badge>
						);
					})}
				</div>
			</div>

			{event.subEvents && event.subEvents.length > 0 && (
				<div className="mt-10">
					<h2 className="text-4xl max-sm:text-2xl mt-3 text-center text-primary font-bold">
						Sub-Events
					</h2>
					<br />
					<div className="flex flex-wrap justify-center gap-5">
						{event.subEvents.map((subEvent: any) => {
							const subEventLikedEvent = user?.likedEvents ? user.likedEvents.includes(subEvent._id) : false;
							return (
								<EventCard
									key={subEvent._id}
									event={subEvent}
									currentUserId={userId}
									user={user}
									likedEvent={subEventLikedEvent}
									page="event-detail"
								/>
							);
						})}
					</div>
				</div>
			)}

			{!event.parentEvent && relatedEvents.length > 0 && (
				<div className="mt-10">
					<h2 className="text-4xl max-sm:text-2xl mt-3 text-center text-primary font-bold">
						Related Events
					</h2>
					<br />
					<EventCards
						events={relatedEvents}
						currentUserId={userId}
						emptyTitle="No Related Events Found"
						emptyStateSubtext="Check out other events below"
						user={user}
						page="event-detail"
					/>
				</div>
			)}
		</div>
	);
};

export default Page;