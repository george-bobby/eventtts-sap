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
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-600 bg-clip-text text-transparent">
					My Event Tickets
				</h1>
				<p className="text-gray-600 max-w-2xl mx-auto">
					Manage your booked events and report any issues you encounter. Use the "Report Issue" button if you need help with any aspect of your booked events.
				</p>
			</div>


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
