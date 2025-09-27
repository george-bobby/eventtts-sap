"use client";
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
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
import { campusLocations } from "@/lib/campus-data";
import { createEvent, updateEvent } from "@/lib/actions/event.action";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { FileUploader } from "./FileUploader";
import SubEventForm from "./SubEventForm";
import { useUploadThing } from "@/lib/uploadthing";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// ---------------- SUB EVENT SCHEMA ----------------
const subEventSchema = z.object({
	title: z.string().min(2, { message: "Title must be at least 2 characters." }),
	description: z.string().trim().min(2, { message: "Description must be at least 2 characters." }).optional(),
	photo: z.string().optional(),
	startDate: z.date(),
	endDate: z.date(),
	startTime: z.string(),
	endTime: z.string(),
	isOnline: z.boolean().optional(),
	location: z.string().trim().optional(),
	isFree: z.boolean(),
	price: z.string().trim().optional(),
	totalCapacity: z.string().trim().optional(),
});

// ---------------- EVENT SCHEMA ----------------
const formSchema = z.object({
	title: z.string().trim().min(2, { message: "Title must be at least 2 characters." }),
	category: z.string(),
	tags: z.array(z.string().min(2, { message: "Tag must be at least 2 characters." }))
		.min(1, { message: "At least one tag is required." }),
	description: z.string().trim().min(2, { message: "Description must be at least 2 characters." }),
	photo: z.string(),
	isOnline: z.boolean().optional(),
	location: z.string().trim().optional(),
	landmark: z.string().trim().optional(),
	campusLocation: z.string().trim().optional(),
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
	subEvents: z.array(subEventSchema).optional(),
});

// ---------------- INTERFACES ----------------
interface IEvent {
	_id: string;
	title: string;
	category: any;
	tags: any[];
	description: string;
	photo: string;
	isOnline?: boolean;
	location?: string;
	landmark?: string;
	campusLocation?: string;
	startDate: string | Date;
	endDate: string | Date;
	startTime: string;
	endTime: string;
	duration?: number;
	totalCapacity?: number;
	isFree: boolean;
	price?: number;
	ageRestriction?: number;
	url?: string;
	organizer: string;
}

interface Props {
	userId: string;
	type: "create" | "edit";
	event?: IEvent;
	eventId?: string;
}

const EventForm = ({ userId, type = "create", event, eventId }: Props) => {
	const { toast } = useToast();
	const router = useRouter();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [CategoryData, setCategoryData] = useState([...categories]);
	const { startUpload } = useUploadThing("imageUploader");

	// ---------------- INITIAL VALUES ----------------
	const getInitialValues = () => {
		if (event && type === "edit") {
			const tagNames = event.tags.map(tag =>
				typeof tag === "object" ? tag.name : tag
			);

			return {
				title: event.title || "",
				category: event.category._id || event.category || "",
				tags: tagNames || [],
				description: event.description || "",
				photo: event.photo || "",
				isOnline: event.isOnline || false,
				location: event.location || "",
				landmark: event.landmark || "",
				campusLocation: event.campusLocation || "",
				startDate: new Date(event.startDate),
				endDate: new Date(event.endDate),
				startTime: event.startTime || "",
				endTime: event.endTime || "",
				duration: event.duration ? event.duration.toString() : "",
				totalCapacity: event.totalCapacity ? event.totalCapacity.toString() : "",
				isFree: event.isFree || false,
				price: event.price ? event.price.toString() : "",
				ageRestriction: event.ageRestriction ? event.ageRestriction.toString() : "",
				url: event.url || "",
				subEvents: [],
			};
		}
		return {
			title: "",
			category: "",
			tags: [],
			description: "",
			photo: "",
			isOnline: false,
			location: "",
			landmark: "",
			campusLocation: "",
			startDate: new Date(),
			endDate: new Date(),
			startTime: "",
			endTime: "",
			duration: "",
			totalCapacity: "",
			isFree: false,
			price: "",
			ageRestriction: "",
			url: "",
			subEvents: [],
		};
	};

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: getInitialValues(),
	});

	const { fields, append, remove } = useFieldArray({
		name: "subEvents",
		control: form.control,
	});

	useEffect(() => {
		if (event && type === "edit") {
			form.reset(getInitialValues());
		}
	}, [event, type, form]);

	// ---------------- SUBMIT ----------------
	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);
		let uploadedImageUrl = values.photo;

		try {
			if (files.length > 0) {
				const uploadedImages = await startUpload(files);
				if (!uploadedImages) throw new Error("Please upload a valid image below of 4MB.");
				uploadedImageUrl = uploadedImages[0].url;
			}

			if (type === "edit") {
				if (!eventId) throw new Error("Event ID is required for updating.");

				const updatedEvent = await updateEvent({
					userId,
					event: {
						_id: eventId,
						...values,
						photo: uploadedImageUrl,
						imageUrl: uploadedImageUrl,
						duration: values.duration ? +values.duration : undefined,
						totalCapacity: values.totalCapacity ? +values.totalCapacity : undefined,
						price: values.price ? +values.price : undefined,
						ageRestriction: values.ageRestriction ? +values.ageRestriction : undefined,
					},
					path: `/event/${eventId}`,
				});

				if (updatedEvent) {
					form.reset();
					router.push(`/event/${updatedEvent._id}`);
					toast({ title: "Success!", description: "Event updated successfully." });
				}
			} else {
				const newEvent = await createEvent({
					...values,
					photo: uploadedImageUrl,
					imageUrl: uploadedImageUrl,
					duration: values.duration ? +values.duration : undefined,
					totalCapacity: values.totalCapacity ? +values.totalCapacity : undefined,
					price: values.price ? +values.price : undefined,
					ageRestriction: values.ageRestriction ? +values.ageRestriction : undefined,
					organizer: userId,
				});

				if (newEvent) {
					form.reset();
					router.push(`/event/${newEvent._id}`);
					toast({ title: "Success!", description: "Event created successfully." });
				}
			}
		} catch (error: any) {
			toast({ variant: "destructive", title: "Something went wrong.", description: error.message });
		} finally {
			setIsSubmitting(false);
		}
	}

	// ---------------- TAG HANDLING ----------------
	const handleKeyDown = (e: React.KeyboardEvent, field: any) => {
		if ((e.key === "Enter" && field.name === "tags") || (e.key === "," && field.name === "tags")) {
			e.preventDefault();
			const tagInput = e.target as HTMLInputElement;
			const tagValue = tagInput.value.trim().toLowerCase();

			if (tagValue.length > 15) {
				return form.setError("tags", { type: "required", message: "Max length should not exceed 15 characters" });
			}

			if (!field.value.includes(tagValue)) {
				form.setValue("tags", [...field.value, tagValue]);
				tagInput.value = "";
				form.clearErrors("tags");
			} else {
				form.setError("tags", { type: "validate", message: "Already exists" });
				form.trigger();
			}
		}
	};

	const removeTagHandler = (tag: string | { _id: string; name: string }, field: any) => {
		const newTags = field.value.filter((t: any) =>
			typeof t === "object" && typeof tag === "object" ? t._id !== tag._id : t !== tag
		);
		form.setValue("tags", newTags);
	};

	// ---------------- FORM JSX ----------------
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
				{/* Title Field */}
				<FormField
					control={form.control}
					name="title"
					render={({ field }: any) => (
						<FormItem className="w-full">
							<FormControl>
								<Input placeholder="Event title" {...field} className="input-field" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Category and Tags Fields - Side by Side */}
				<div className="flex flex-col md:flex-row gap-4 w-full">
					{/* Category Field */}
					<FormField
						control={form.control}
						name="category"
						render={({ field }: any) => (
							<FormItem className="w-full md:w-1/2">
								<FormLabel className="text-gray-700 font-medium">Category</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<SelectTrigger className="w-full h-12 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200">
											<SelectValue placeholder="Select Category" className="text-gray-700" />
										</SelectTrigger>
										<SelectContent className="max-h-60 w-full bg-white border border-gray-200 rounded-lg shadow-xl">
											{categories.map((category, index) => (
												<SelectItem
													key={index}
													value={category.title.toLowerCase()}
													className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 focus:bg-red-100 cursor-pointer transition-colors duration-150"
												>
													<div className="flex items-center space-x-2">
														<span className="text-red-600 text-lg">
															{category.icon}
														</span>
														<span className="text-gray-800 font-medium">
															{category.title}
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Tags Field */}
					<FormField
						control={form.control}
						name="tags"
						render={({ field }: any) => (
							<FormItem className="w-full md:w-1/2">
								<FormLabel className="text-gray-700 font-medium">Tags</FormLabel>
								<FormControl>
									<div>
										<Input
											placeholder="Add tags (press Enter or comma to add)"
											onKeyDown={(e) => handleKeyDown(e, field)}
											className="input-field h-12"
										/>
										<div className="flex flex-wrap gap-2 mt-2">
											{field.value?.map((tag: string, index: number) => (
												<Badge key={index} variant="secondary" className="cursor-pointer">
													{tag}
													<button
														type="button"
														onClick={() => removeTagHandler(tag, field)}
														className="ml-1 text-red-500"
													>
														×
													</button>
												</Badge>
											))}
										</div>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Description Field */}
				<FormField
					control={form.control}
					name="description"
					render={({ field }: any) => (
						<FormItem className="w-full">
							<FormControl>
								<Textarea placeholder="Event description" {...field} className="textarea rounded-2xl" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Photo Upload */}
				<FormField
					control={form.control}
					name="photo"
					render={({ field }: any) => (
						<FormItem className="w-full">
							<FormControl>
								<FileUploader
									onFieldChange={field.onChange}
									imageUrl={field.value}
									setFiles={setFiles}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Location Fields */}
				<div className="flex flex-col gap-5 md:flex-row">
					<FormField
						control={form.control}
						name="location"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<Input placeholder="Event location or URL" {...field} className="input-field" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="landmark"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<Input placeholder="Nearby landmark" {...field} className="input-field" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Campus Location Field */}
				<FormField
					control={form.control}
					name="campusLocation"
					render={({ field }: any) => (
						<FormItem className="w-full">
							<FormLabel className="text-gray-700 font-medium">Campus Location (for Navigation)</FormLabel>
							<FormControl>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<SelectTrigger className="w-full h-12 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200">
										<SelectValue placeholder="Select Campus Location" className="text-gray-700" />
									</SelectTrigger>
									<SelectContent className="max-h-60 w-full bg-white border border-gray-200 rounded-lg shadow-xl">
										{campusLocations.map((location, index) => (
											<SelectItem
												key={index}
												value={location.name}
												className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 focus:bg-red-100 cursor-pointer transition-colors duration-150"
											>
												<span className="text-gray-800 font-medium">
													{location.name}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Date Fields */}
				<div className="flex flex-col gap-5 md:flex-row">
					<FormField
						control={form.control}
						name="startDate"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className={cn(
													"w-full pl-3 text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												{field.value ? (
													format(field.value, "PPP")
												) : (
													<span>Pick start date</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date: Date) =>
													date < new Date() || date < new Date("1900-01-01")
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="endDate"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className={cn(
													"w-full pl-3 text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												{field.value ? (
													format(field.value, "PPP")
												) : (
													<span>Pick end date</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date: Date) =>
													date < new Date() || date < new Date("1900-01-01")
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Time Fields */}
				<div className="flex flex-col gap-5 md:flex-row">
					<FormField
						control={form.control}
						name="startTime"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<Input type="time" {...field} className="input-field" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="endTime"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<Input type="time" {...field} className="input-field" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Price Fields */}
				<div className="flex flex-col gap-5 md:flex-row">
					<FormField
						control={form.control}
						name="isFree"
						render={({ field }: any) => (
							<FormItem>
								<FormControl>
									<div className="flex items-center">
										<label
											htmlFor="isFree"
											className="whitespace-nowrap pr-3 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											Free Ticket
										</label>
										<Checkbox
											onCheckedChange={field.onChange}
											checked={field.value}
											id="isFree"
											className="mr-2 h-5 w-5 border-2 border-primary-500"
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="price"
						render={({ field }: any) => (
							<FormItem className="w-full">
								<FormControl>
									<div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
										<Image
											src="/icons/dollar.svg"
											alt="dollar"
											width={24}
											height={24}
											className="filter-grey"
										/>
										<Input
											type="number"
											placeholder="Price"
											{...field}
											className="p-regular-16 border-0 bg-grey-50 outline-offset-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Capacity Field */}
				<FormField
					control={form.control}
					name="totalCapacity"
					render={({ field }: any) => (
						<FormItem className="w-full">
							<FormControl>
								<Input
									type="number"
									placeholder="Total capacity (optional)"
									{...field}
									className="input-field"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* URL Field */}
				<FormField
					control={form.control}
					name="url"
					render={({ field }: any) => (
						<FormItem className="w-full">
							<FormControl>
								<Input placeholder="Event URL (optional)" {...field} className="input-field" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Sub Events Section */}
				<div className="flex flex-col gap-5">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Sub Events</h3>
						<Button
							type="button"
							variant="outline"
							onClick={() => append({
								title: "",
								description: "",
								photo: "",
								startDate: new Date(),
								endDate: new Date(),
								startTime: "",
								endTime: "",
								isOnline: false,
								location: "",
								isFree: true,
								price: "",
								totalCapacity: "",
							})}
						>
							Add Sub Event
						</Button>
					</div>

					{fields.map((field: any, index: number) => (
						<div key={field.id} className="border rounded-lg p-4">
							<div className="flex items-center justify-between mb-4">
								<h4 className="font-medium">Sub Event {index + 1}</h4>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => remove(index)}
								>
									Remove
								</Button>
							</div>
							<SubEventForm index={index} />
						</div>
					))}
				</div>

				<div className="col-span-2 mt-8 mb-12">
					<Button
						type="submit"
						size="lg"
						disabled={isSubmitting}
						className="w-full bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
					>
						{isSubmitting ? (
							<span className="flex items-center justify-center gap-2">
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								Submitting...
							</span>
						) : (
							`${type === "create" ? "Create Event" : "Update Event"}`
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default EventForm;
