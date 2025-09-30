import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/dbconnection';
import Event from '@/lib/models/event.model';
import Report from '@/lib/models/report.model';
import { getEventStatistics } from '@/lib/actions/order.action';
import { getFeedbackAnalytics } from '@/lib/actions/feedback.action';
import { getUserByClerkId } from '@/lib/actions/user.action';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Zod schema for report generation
const reportSchema = z.object({
	title: z.string(),
	sections: z.array(
		z.object({
			heading: z.string(),
			content: z.array(z.string()),
		})
	),
});

// Zod schema for request body
const requestSchema = z.object({
	eventId: z.string(),
	report: z.object({
		preparedBy: z.string(),
		keyHighlights: z.string(),
		majorOutcomes: z.string(),
		budget: z.string(),
		sponsorship: z.string().optional(),
		actualExpenditure: z.string(),
		photos: z.string().optional(),
	}),
	format: z.enum(['json', 'pdf', 'word']).default('json'),
});

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get MongoDB user ID
		const mongoUser = await getUserByClerkId(userId);
		if (!mongoUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { eventId, report, format } = requestSchema.parse(body);

		await connectToDatabase();

		// Get event data
		const event = await Event.findById(eventId)
			.populate('category')
			.populate('organizer', 'firstName lastName email')
			.populate('tags', 'name');

		if (!event) {
			return NextResponse.json({ error: 'Event not found' }, { status: 404 });
		}

		// Get event statistics
		const stats = await getEventStatistics(eventId);

		// Get feedback analytics
		let feedbackAnalytics = null;
		try {
			feedbackAnalytics = await getFeedbackAnalytics(
				eventId,
				event.organizer._id.toString()
			);
		} catch (error) {
			console.log('No feedback data available for this event');
		}

		// Calculate metrics
		const attendanceRate =
			event.totalCapacity > 0
				? ((stats.totalTicketsSold / event.totalCapacity) * 100).toFixed(1)
				: '0';

		const budget = parseFloat(report.budget) || 0;
		const actualExpenditure = parseFloat(report.actualExpenditure) || 0;
		const sponsorship = report.sponsorship
			? parseFloat(report.sponsorship) || 0
			: 0;
		const totalIncome = stats.totalRevenue + sponsorship;
		const profitLoss = totalIncome - actualExpenditure;

		// Generate AI report using AI SDK
		const prompt = `
      Analyze the following comprehensive event data and generate a professional event report.
      
      **AUTOMATED EVENT DATA:**
      - Event Title: ${event.title}
      - Event Category: ${event.category?.name || 'N/A'}
      - Event Description: ${event.description}
      - Event Type: ${
				event.isOnline ? 'Virtual/Online Event' : 'Physical Event'
			}
      - Location: ${
				event.isOnline ? 'Online Platform' : event.location || 'N/A'
			}
      - Event Duration: ${new Date(
				event.startDate
			).toLocaleDateString()} to ${new Date(event.endDate).toLocaleDateString()}
      - Event Timing: ${event.startTime} - ${event.endTime}
      - Organizer: ${event.organizer?.firstName} ${event.organizer?.lastName}
      - Event Tags: ${
				event.tags?.map((tag: any) => tag.name).join(', ') || 'N/A'
			}

      **ATTENDANCE & PERFORMANCE METRICS:**
      - Total Seating Capacity: ${event.totalCapacity}
      - Tickets Sold: ${stats.totalTicketsSold}
      - Attendance Rate: ${attendanceRate}%
      - Tickets Remaining: ${event.ticketsLeft || 0}
      - Event Status: ${event.soldOut ? 'Sold Out' : 'Available'}

      **FINANCIAL ANALYSIS:**
      - Ticket Pricing: ${
				event.isFree ? 'Free Event' : `₹${event.price} per ticket`
			}
      - Total Revenue from Tickets: ₹${stats.totalRevenue}
      - Planned Budget: ₹${budget}
      - Actual Expenditure: ₹${actualExpenditure}
      - Sponsorship Revenue: ₹${sponsorship}
      - Total Income: ₹${totalIncome}
      - Profit/Loss: ₹${profitLoss} (${profitLoss >= 0 ? 'Profit' : 'Loss'})

      **USER-PROVIDED INSIGHTS:**
      - Report Prepared By: ${report.preparedBy}
      - Key Highlights: ${report.keyHighlights}
      - Major Outcomes: ${report.majorOutcomes}

      ${
				feedbackAnalytics
					? `
      **FEEDBACK ANALYTICS:**
      - Average Overall Satisfaction: ${feedbackAnalytics.averageRatings.overallSatisfaction}/5
      - Average Content Quality: ${feedbackAnalytics.averageRatings.contentQuality}/5
      - Average Organization Rating: ${feedbackAnalytics.averageRatings.organizationRating}/5
      - Total Responses: ${feedbackAnalytics.totalResponses}
      - Response Rate: ${feedbackAnalytics.responseRate}%
      - NPS Score: ${feedbackAnalytics.npsScore}
      `
					: '**FEEDBACK ANALYTICS:** No feedback data available for this event.'
			}

      **INSTRUCTIONS:**
      Create a comprehensive report with these sections:
      1. "Executive Summary" - Overall event overview and success metrics
      2. "Event Performance Analysis" - Detailed attendance, engagement, and operational analysis
      3. "Financial Summary & ROI" - Complete financial breakdown with profit/loss analysis
      4. "Attendee Feedback & Satisfaction" - Analysis of feedback data, satisfaction scores, and attendee insights
      5. "Key Achievements & Outcomes" - Based on user highlights and measurable results
      6. "Recommendations & Future Improvements" - Data-driven suggestions for future events based on all metrics

      Make the report professional, data-driven, and actionable. Include specific numbers and percentages where relevant.
    `;

		const { object: reportData } = (await generateObject({
			model: google('gemini-2.0-flash-exp'),
			schema: reportSchema,
			prompt,
		})) as { object: z.infer<typeof reportSchema> };

		// Save report to database
		const savedReport = await Report.create({
			...report,
			generatedContent: JSON.stringify(reportData),
			event: eventId,
			organizer: mongoUser._id,
		});

		// Handle different output formats
		if (format === 'pdf') {
			const pdfBuffer = await generatePDF(reportData, event, report.photos);
			return new NextResponse(pdfBuffer as Buffer, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${event.title}-report.pdf"`,
				},
			});
		}

		if (format === 'word') {
			const wordBuffer = await generateWord(reportData, event, report.photos);
			return new NextResponse(wordBuffer as Buffer, {
				headers: {
					'Content-Type':
						'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					'Content-Disposition': `attachment; filename="${event.title}-report.docx"`,
				},
			});
		}

		// Default JSON response
		return NextResponse.json({
			success: true,
			reportData,
			reportId: savedReport._id,
		});
	} catch (error) {
		console.error('Error generating report:', error);
		return NextResponse.json(
			{
				error: 'Failed to generate report',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// Helper function to generate PDF
async function generatePDF(
	reportData: any,
	event: any,
	photoUrl?: string
): Promise<Buffer> {
	const pdf = new jsPDF();
	let yPosition = 20;

	// Title
	pdf.setFontSize(20);
	pdf.text(reportData.title, 20, yPosition);
	yPosition += 20;

	// Event info
	pdf.setFontSize(12);
	pdf.text(`Event: ${event.title}`, 20, yPosition);
	yPosition += 10;
	pdf.text(
		`Date: ${new Date(event.startDate).toLocaleDateString()}`,
		20,
		yPosition
	);
	yPosition += 20;

	// Sections
	for (const section of reportData.sections) {
		// Check if we need a new page
		if (yPosition > 250) {
			pdf.addPage();
			yPosition = 20;
		}

		pdf.setFontSize(14);
		pdf.text(section.heading, 20, yPosition);
		yPosition += 10;

		pdf.setFontSize(10);
		for (const content of section.content) {
			const lines = pdf.splitTextToSize(content, 170);
			for (const line of lines) {
				if (yPosition > 280) {
					pdf.addPage();
					yPosition = 20;
				}
				pdf.text(line, 20, yPosition);
				yPosition += 5;
			}
			yPosition += 5;
		}
		yPosition += 10;
	}

	// Add photo if provided
	if (photoUrl) {
		try {
			pdf.addPage();
			pdf.setFontSize(14);
			pdf.text('Event Photos', 20, 20);
			// Note: For production, you'd want to fetch and embed the actual image
			pdf.text(`Photo URL: ${photoUrl}`, 20, 40);
		} catch (error) {
			console.error('Error adding photo to PDF:', error);
		}
	}

	return Buffer.from(pdf.output('arraybuffer'));
}

// Helper function to generate Word document
async function generateWord(
	reportData: any,
	event: any,
	photoUrl?: string
): Promise<Buffer> {
	const children = [];

	// Title
	children.push(
		new Paragraph({
			children: [new TextRun({ text: reportData.title, bold: true, size: 32 })],
			heading: HeadingLevel.TITLE,
		})
	);

	// Event info
	children.push(
		new Paragraph({
			children: [new TextRun({ text: `Event: ${event.title}`, bold: true })],
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: `Date: ${new Date(event.startDate).toLocaleDateString()}`,
				}),
			],
		}),
		new Paragraph({ children: [new TextRun({ text: '' })] }) // Empty line
	);

	// Sections
	for (const section of reportData.sections) {
		children.push(
			new Paragraph({
				children: [
					new TextRun({ text: section.heading, bold: true, size: 24 }),
				],
				heading: HeadingLevel.HEADING_1,
			})
		);

		for (const content of section.content) {
			children.push(
				new Paragraph({
					children: [new TextRun({ text: content })],
				})
			);
		}

		children.push(new Paragraph({ children: [new TextRun({ text: '' })] })); // Empty line
	}

	// Add photo reference if provided
	if (photoUrl) {
		children.push(
			new Paragraph({
				children: [new TextRun({ text: 'Event Photos', bold: true, size: 24 })],
				heading: HeadingLevel.HEADING_1,
			}),
			new Paragraph({
				children: [new TextRun({ text: `Photo URL: ${photoUrl}` })],
			})
		);
	}

	const doc = new Document({
		sections: [
			{
				properties: {},
				children,
			},
		],
	});

	return await Packer.toBuffer(doc);
}
