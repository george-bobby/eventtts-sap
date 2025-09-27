import NoResults from "@/components/shared/NoResults";
import OrderCards from "@/components/shared/OrderCards";
import { getOrdersByUserId } from "@/lib/actions/order.action";
import { getUserByClerkId } from "@/lib/actions/user.action";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import React from "react";

const Page = async () => {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const user = await getUserByClerkId(userId);

	const orders = await getOrdersByUserId({ userId: user._id });
	const events = orders?.data || [];

	const upcomingEvents = events.filter((event: any) => {
		return new Date(event.event.startDate) > new Date();
	});

	const pastEvents = events.filter((event: any) => {
		return new Date(event.event.startDate) < new Date();
	});

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header Section */}
			<div className="text-center mb-8">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					My Event Tickets
				</h1>
				<p className="text-gray-600 max-w-2xl mx-auto">
					Manage your booked events and report any issues you encounter. Use the "Report Issue" button if you need help with any aspect of your booked events.
				</p>
			</div>

			{/* Info Card about Report Issue Feature */}
			{(upcomingEvents.length > 0 || pastEvents.length > 0) && (
				<Card className="bg-orange-50 border-orange-200 mb-8">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-orange-800">
							<HelpCircle className="w-5 h-5" />
							Need Help with Your Events?
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-orange-700">
							You can report issues for any event you have tickets for. Common issues include:
						</p>
						<div className="grid md:grid-cols-2 gap-3 text-sm text-orange-700">
							<div className="flex items-start gap-2">
								<AlertTriangle className="w-4 h-4 mt-0.5 text-orange-600" />
								<span>Ticket or registration problems</span>
							</div>
							<div className="flex items-start gap-2">
								<Clock className="w-4 h-4 mt-0.5 text-orange-600" />
								<span>Event timing or venue issues</span>
							</div>
							<div className="flex items-start gap-2">
								<CheckCircle className="w-4 h-4 mt-0.5 text-orange-600" />
								<span>Accessibility or facility concerns</span>
							</div>
							<div className="flex items-start gap-2">
								<HelpCircle className="w-4 h-4 mt-0.5 text-orange-600" />
								<span>Payment or billing questions</span>
							</div>
						</div>
						<p className="text-sm text-orange-600 font-medium">
							Click "Report Issue" on any event card to get help from the event organizer.
						</p>
					</CardContent>
				</Card>
			)}

			<div className="flex flex-col gap-10">
				<div>
					<h3 className="text-3xl max-sm:text-xl font-bold text-center text-primary mb-2">
						Upcoming Events
					</h3>
					<p className="text-center text-gray-600 mb-6">
						Events you have tickets for that are coming up
					</p>
					{upcomingEvents.length > 0 ? (
						<OrderCards events={upcomingEvents} currentUserId={userId} />
					) : (
						<NoResults
							title={"You have no upcoming events"}
							desc={"Book some events to see them here"}
							link={"/#categories"}
							linkTitle={"Explore Events"}
						/>
					)}
				</div>

				<div>
					<h3 className="text-3xl max-sm:text-xl font-bold text-center text-primary mb-2">
						Past Events
					</h3>
					<p className="text-center text-gray-600 mb-6">
						Events you attended - you can still report issues if needed
					</p>
					{pastEvents.length > 0 ? (
						<OrderCards events={pastEvents} currentUserId={userId} />
					) : (
						<NoResults
							title={"You don't have any past events"}
							desc={"Events you attended will appear here"}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default Page;
