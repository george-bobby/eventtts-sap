import EventForm from "@/components/shared/EventForm";
import { getUserByClerkId, getUserById } from "@/lib/actions/user.action";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import React from "react";


const Page = async () => {
	// ✅ Await auth() to avoid header issues in Next.js 15
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const user = await getUserByClerkId(userId);

	return (
		<div className="bg-gradient-to-br from-red-50 via-white to-rose-50 min-h-screen pb-20">
			<div className="container mx-auto px-4 py-12 max-w-4xl">
				{/* Header Section */}
				<div className="text-center mb-12">
					<div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-6">
						✨ Create Something Amazing
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
						Create a New Event
					</h1>
					{/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Bring your community together. Create memorable experiences and connect with like-minded people.
					</p> */}

				</div>

				{/* Form Section */}
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
					<EventForm
						userId={user._id}
						type="create"
					/>
				</div>
			</div>
		</div>
	);
};

export default Page;
