// lib/actions/report.action.ts

'use server';

import { CreateReportParams } from '@/types';
import { connectToDatabase } from '../dbconnection';
import Event from '../models/event.model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEventStatistics } from './order.action';
import Report from '../models/report.model';
import User from '../models/user.model';

export async function generatePdfObject({
	report,
	eventId,
}: Omit<CreateReportParams, 'path' | 'userId'>) {
	try {
		await connectToDatabase();

		const event = await Event.findById(eventId)
			.populate('category')
			.populate('organizer', 'firstName lastName email')
			.populate('tags', 'name');
		if (!event) throw new Error('Event not found');

		const stats = await getEventStatistics(eventId);

		// Calculate attendance rate
		const attendanceRate =
			event.totalCapacity > 0
				? ((stats.totalTicketsSold / event.totalCapacity) * 100).toFixed(1)
				: '0';

		// Calculate profit/loss
		const budget = parseFloat(report.budget) || 0;
		const actualExpenditure = parseFloat(report.actualExpenditure) || 0;
		const sponsorship = report.sponsorship
			? parseFloat(report.sponsorship) || 0
			: 0;
		const totalIncome = stats.totalRevenue + sponsorship;
		const profitLoss = totalIncome - actualExpenditure;

		// --- Gemini API Integration ---
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

		// --- THIS IS THE FIX ---
		// Update the model name from "gemini-pro" to "gemini-1.5-flash"
		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			generationConfig: {
				responseMimeType: 'application/json',
			},
		});

		const prompt = `
      Analyze the following comprehensive event data and generate a professional event report.
      Generate a structured JSON object representing a detailed post-event analysis.
      The JSON object must follow this exact schema:
      {
        "title": "string",
        "sections": [
          { "heading": "string", "content": ["string", "string", ...] },
          { "heading": "string", "content": ["string", "string", ...] }
        ]
      }
      Do not include any markdown or formatting in the JSON values.

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
      - Ticket Revenue: ₹${stats.totalRevenue}
      - Planned Budget: ₹${budget}
      - Actual Expenditure: ₹${actualExpenditure}
      - Sponsorship/Funding: ₹${sponsorship}
      - Total Income: ₹${totalIncome} (Tickets + Sponsorship)
      - Net Profit/Loss: ₹${profitLoss} ${
			profitLoss >= 0 ? '(Profit)' : '(Loss)'
		}
      - Budget Variance: ${
				actualExpenditure > 0
					? (((actualExpenditure - budget) / budget) * 100).toFixed(1)
					: '0'
			}% ${actualExpenditure > budget ? 'over budget' : 'under budget'}

      **USER-PROVIDED INSIGHTS:**
      - Report Prepared By: ${report.preparedBy}
      - Key Highlights: ${report.keyHighlights}
      - Major Outcomes & Results: ${report.majorOutcomes}
      - Event Photos: ${report.photos ? 'Provided' : 'Not provided'}

      **INSTRUCTIONS:**
      Create a comprehensive report with these sections:
      1. "Executive Summary" - Overall event overview and success metrics
      2. "Event Performance Analysis" - Detailed attendance, engagement, and operational analysis
      3. "Financial Summary & ROI" - Complete financial breakdown with profit/loss analysis
      4. "Key Achievements & Outcomes" - Based on user highlights and measurable results
      5. "Recommendations & Future Improvements" - Data-driven suggestions for future events

      Make the report professional, data-driven, and actionable. Include specific numbers and percentages where relevant.
    `;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const jsonText = response.text();

		const pdfObject = JSON.parse(jsonText);

		return { success: true, pdfObject };
	} catch (error) {
		console.log(error);
		return { success: false, error: (error as Error).message };
	}
}
export async function getReportById(reportId: string) {
	try {
		await connectToDatabase();

		const report = await Report.findById(reportId)
			.populate({
				path: 'event',
				model: Event,
				select: '_id title', // Select specific fields from the event
			})
			.populate({
				path: 'generatedBy',
				model: User,
				select: '_id firstName lastName', // Select specific fields from the user
			});

		if (!report) {
			throw new Error('Report not found');
		}

		return JSON.parse(JSON.stringify(report));
	} catch (error) {
		console.log(error);
		throw error;
	}
}
