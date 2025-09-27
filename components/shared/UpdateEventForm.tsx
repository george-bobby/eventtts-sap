"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/constants/categories";
import { updateEvent } from "@/lib/actions/event.action";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/shared/FileUploader";
import { useUploadThing } from "@/lib/uploadthing";

const formSchema = z.object({
	title: z.string().trim().min(2, { message: "Title must be at least 2 characters." }),
	category: z.string(),
	tags: z.array(z.string().min(2, { message: "Tag must be at least 2 characters." })).min(1, { message: "At least one tag is required." }),
	description: z.string().trim().min(2, { message: "Description must be at least 2 characters." }),
	photo: z.string(),
	isOnline: z.boolean().optional(),
	location: z.string().trim().optional(),
	landmark: z.string().trim().optional(),
	startDate: z.date(),
	endDate: z.date(),
	startTime: z.string(),
	endTime: z.string(),
	duration: z.string().trim().optional(),
	totalCapacity: z.string().trim().optional(),
	isFree: z.boolean(),
	price: z.string().trim().optional(),
	ageRestriction: z.string().trim().optional(),
	url: z.string().trim().optional(),
});

interface Props {
	userId: string;
	event: any;
	eventId: string;
}

const UpdateEventForm = ({ userId, event, eventId }: Props) => {
	const { toast } = useToast();
	const router = useRouter();
	const { startUpload } = useUploadThing("imageUploader");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [files, setFiles] = useState<File[]>([]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			...event,
			startDate: new Date(event.startDate),
			endDate: new Date(event.endDate),
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);
		let uploadedImageUrl = values.photo;

		try {
			if (files.length > 0) {
				const uploadedImages = await startUpload(files);
				if (!uploadedImages) throw new Error("Image upload failed.");
				uploadedImageUrl = uploadedImages[0].url;
			}

			const updatedEvent = await updateEvent({
				userId,
				event: { ...values, photo: uploadedImageUrl, _id: eventId },
				path: `/event/${eventId}`
			});

			if (updatedEvent) {
				form.reset();
				router.push(`/event/${updatedEvent._id}`);
				toast({ title: "Success!", description: "Event updated successfully." });
			}
		} catch (error: any) {
			toast({ variant: "destructive", title: "Something went wrong.", description: error.message });
		} finally {
			setIsSubmitting(false);
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent, field: any) => {
		if ((e.key === "Enter" || e.key === ",") && field.name === "tags") {
			e.preventDefault();
			const tagInput = e.target as HTMLInputElement;
			const tagValue = tagInput.value.trim().toLowerCase();
			if (tagValue.length > 15) {
				return form.setError("tags", { type: "required", message: "Max length is 15 chars." });
			}
			if (tagValue && !field.value.includes(tagValue)) {
				form.setValue("tags", [...field.value, tagValue]);
				tagInput.value = "";
				form.clearErrors("tags");
			}
		}
	};
	const removeTagHandler = (tag: string, field: any) => {
		form.setValue("tags", field.value.filter((t: string) => t !== tag));
	};

	return (
		<Form {...form}>
			<h1 className="text-4xl max-sm:text-2xl font-bold text-center text-primary mb-5">
				Update Event
			</h1>
			<br />
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-10 max-sm:p-4">
				{/* The form fields will now be pre-populated from the event data */}
				{/* --- PASTE ALL YOUR ORIGINAL <FormField> COMPONENTS HERE --- */}
				{/* Example of one field: */}
				<FormField control={form.control} name="title" render={({ field }) => (<FormItem className="w-full"><FormLabel>Title <span className="text-red-700">*</span></FormLabel><FormControl><Input placeholder="Event title..." {...field} /></FormControl><FormMessage /></FormItem>)} />
				{/* ... Paste the rest of your form fields from your original EventForm.tsx here */}
				<div className="flex justify-center items-center">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Updating..." : "Update Event"}
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default UpdateEventForm;