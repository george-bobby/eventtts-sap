// components/shared/ReportForm.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "./FileUploader";
import { useState, useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { IEvent } from "@/lib/models/event.model";
import { useToast } from "@/hooks/use-toast";
import { generatePdfObject } from "@/lib/actions/report.action";
import { getEventStatistics } from "@/lib/actions/order.action";
import jsPDF from "jspdf";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, DollarSign, Clock, Tag } from "lucide-react";

const formSchema = z.object({
  preparedBy: z.string().min(2, "This field is required."),
  eventPurpose: z.string().min(10, "Please describe the event purpose."),
  keyHighlights: z.string().min(10, "Please provide detailed highlights."),
  majorOutcomes: z.string().min(10, "Please describe the major outcomes."),
  objective: z.string().min(10, "Please describe the objective."),
  targetAudience: z.string().min(5, "Please describe the target audience."),
  eventGoals: z.string().min(10, "Please describe the event goals."),
  agenda: z.string().min(10, "Please provide the agenda details."),
  partners: z.string().optional(),
  budgetAllocation: z.string().min(1, "Please provide budget allocation details."),
  vips: z.string().optional(),
  keySessions: z.string().optional(),
  budget: z.string().min(1, "Enter the budget."),
  actualExpenditure: z.string().min(1, "Enter the actual expenditure."),
  sponsorship: z.string().optional(),
  photos: z.string().optional(),
});

type ReportFormProps = {
  eventId: string;
  userId: string;
  event: IEvent;
};

// Define the structure for the AI's JSON response
interface PdfSection {
  heading: string;
  content: string[];
}
interface PdfJsonObject {
  title: string;
  sections: PdfSection[];
}

const ReportForm = ({ eventId, userId, event }: ReportFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload } = useUploadThing("imageUploader");
  const { toast } = useToast();
  const [eventStats, setEventStats] = useState<any>(null);

  // State to manage the UI: show form, or show PDF viewer
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preparedBy: "",
      keyHighlights: "",
      majorOutcomes: "",
      budget: "",
      sponsorship: "",
      actualExpenditure: "",
      photos: ""
    },
  });

  // Fetch event statistics on component mount
  useEffect(() => {
    const fetchEventStats = async () => {
      try {
        const stats = await getEventStatistics(eventId);
        setEventStats(stats);
      } catch (error) {
        console.error("Failed to fetch event statistics:", error);
      }
    };
    fetchEventStats();
  }, [eventId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      let uploadedImageUrl = values.photos;
      if (files.length > 0) {
        const uploadedImages = await startUpload(files);
        if (!uploadedImages) throw new Error("Image upload failed.");
        uploadedImageUrl = uploadedImages[0].url;
      }

      const result = await generatePdfObject({
        report: { ...values, photos: uploadedImageUrl || "" },
        eventId,
      });

      if (!result.success || !result.pdfObject) {
        throw new Error(result.error || "Failed to get PDF data from AI.");
      }

      // --- PDF Generation from JSON Object ---
      const doc = new jsPDF();
      const pdfData = result.pdfObject as PdfJsonObject;
      let y = 20;

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(pdfData.title, 105, y, { align: "center" });
      y += 15;

      pdfData.sections.forEach(section => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(section.heading, 15, y);
        y += 8;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        section.content.forEach(line => {
          if (y > 280) { doc.addPage(); y = 20; }
          const splitLines = doc.splitTextToSize(line, 180);
          doc.text(splitLines, 15, y);
          y += (splitLines.length * 5) + 3;
        });
        y += 5;
      });

      // Generate a blob URL to display in the iframe
      const pdfBlobUrl = doc.output('datauristring');
      setPdfUrl(pdfBlobUrl);

      toast({ title: "Report Ready!", description: "Your AI-powered report is now visible below." });

    } catch (error) {
      toast({ title: "An Error Occurred", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${event.title.replace(/\s+/g, '_')}_AI_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Event Overview Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CalendarDays className="h-6 w-6 text-primary" />
            Event Overview
          </CardTitle>
          <CardDescription>
            Automatically populated from your event data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                Category
              </div>
              <Badge variant="secondary" className="text-sm">
                {(event.category as any)?.name || 'N/A'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <p className="text-sm font-medium">
                {event.isOnline ? 'Online Event' : event.location || 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duration
              </div>
              <p className="text-sm font-medium">
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Capacity
              </div>
              <p className="text-sm font-medium">
                {event.totalCapacity} total seats
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Pricing
              </div>
              <p className="text-sm font-medium">
                {event.isFree ? 'Free Event' : `₹${event.price}`}
              </p>
            </div>

            {eventStats && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Attendance
                </div>
                <p className="text-sm font-medium">
                  {eventStats.totalTicketsSold} tickets sold
                </p>
              </div>
            )}
          </div>

          {eventStats && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Revenue Summary</h4>
              <p className="text-green-700">
                Total Revenue: <span className="font-bold">₹{eventStats.totalRevenue.toLocaleString('en-IN')}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Conditional Rendering: Show PDF or Show Form --- */}
      {pdfUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">🎉 Your AI Report is Ready!</CardTitle>
            <CardDescription className="text-center">
              Your comprehensive event report has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full h-[700px] border-2 border-primary/20 rounded-lg overflow-hidden shadow-lg">
                <iframe src={pdfUrl} width="100%" height="100%" title="PDF Report" className="rounded-lg" />
              </div>
              <Button onClick={downloadPdf} size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold">
                📥 Download PDF Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✨ Generate AI-Powered Report
            </CardTitle>
            <CardDescription>
              Fill in the key details below. Most event information is automatically included from your event data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Report Author */}
                <FormField
                  control={form.control}
                  name="preparedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Report Prepared By *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name or organization"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Purpose */}
                <FormField
                  control={form.control}
                  name="eventPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Event Purpose *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What was the main purpose or reason for organizing this event?"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Objective */}
                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Event Objective *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What specific objectives were you trying to achieve with this event?"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Audience */}
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Target Audience *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Who was the intended audience for this event?"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Goals */}
                <FormField
                  control={form.control}
                  name="eventGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Event Goals *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What were the specific goals you set for this event?"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Agenda */}
                <FormField
                  control={form.control}
                  name="agenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Event Agenda *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a brief overview of the event agenda or schedule..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Key Highlights */}
                <FormField
                  control={form.control}
                  name="keyHighlights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Key Highlights *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the most memorable moments, achievements, or standout features of your event..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Major Outcomes */}
                <FormField
                  control={form.control}
                  name="majorOutcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Major Outcomes & Results *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What were the main results, learnings, or impacts of the event? Include any feedback received..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Planned Budget (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actualExpenditure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Actual Expenditure (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="45000"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sponsorship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Sponsorship/Funding (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10000"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Optional Fields Section */}
                <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Additional Details (Optional)</h3>
                  
                  {/* Partners */}
                  <FormField
                    control={form.control}
                    name="partners"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Partners & Collaborators</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any partners, sponsors, or collaborating organizations..."
                            className="min-h-[80px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Allocation */}
                  <FormField
                    control={form.control}
                    name="budgetAllocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Budget Allocation Details *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details on how the budget was allocated across different categories..."
                            className="min-h-[80px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* VIPs */}
                  <FormField
                    control={form.control}
                    name="vips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">VIPs & Special Guests</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List important attendees, keynote speakers, or VIP guests..."
                            className="min-h-[80px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Key Sessions */}
                  <FormField
                    control={form.control}
                    name="keySessions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Key Sessions & Activities</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Highlight the most important sessions, workshops, or activities..."
                            className="min-h-[80px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photo Upload */}
                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Event Photos</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6">
                          <FileUploader
                            onFieldChange={field.onChange}
                            imageUrl={field.value || ""}
                            setFiles={setFiles}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isGenerating}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Generating AI Report...
                      </>
                    ) : (
                      <>
                        🚀 Generate AI-Powered Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportForm;