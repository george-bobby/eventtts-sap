'use server';

import { connectToDatabase } from '../dbconnection';
import { CertificateTemplate, Certificate } from '../models/certificate.model';
import { Stakeholder } from '../models/stakeholder.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import { revalidatePath } from 'next/cache';
import jsPDF from 'jspdf';
import {
	createDefaultTemplates,
	getDefaultTemplateByRole,
	generateDefaultCertificateContent,
} from './defaultTemplates.action';

export interface CreateCertificateTemplateParams {
	eventId: string;
	name: string;
	description?: string;
	templateUrl: string;
	templateType: 'pdf' | 'image';
	fields: {
		id: string;
		name: string;
		type: 'text' | 'date' | 'signature' | 'image';
		x: number;
		y: number;
		width?: number;
		height?: number;
		fontSize?: number;
		fontFamily?: string;
		color?: string;
		required: boolean;
	}[];
	createdBy: string;
}

export interface GenerateCertificateParams {
	templateId: string;
	stakeholderId: string;
	fieldValues: { [fieldId: string]: string };
}

export interface BulkGenerateCertificatesParams {
	templateId: string;
	stakeholderIds: string[];
	defaultFieldValues?: { [fieldId: string]: string };
}

/**
 * Create a new certificate template
 */
export async function createCertificateTemplate(
	params: CreateCertificateTemplateParams
) {
	try {
		await connectToDatabase();

		// Verify event exists and user has permission
		const event = await Event.findById(params.eventId);
		if (!event) {
			throw new Error('Event not found');
		}

		const template = await CertificateTemplate.create({
			event: params.eventId,
			name: params.name,
			description: params.description,
			templateUrl: params.templateUrl,
			templateType: params.templateType,
			fields: params.fields,
			createdBy: params.createdBy,
		});

		revalidatePath(`/event/${params.eventId}/certificates`);
		return JSON.parse(JSON.stringify(template));
	} catch (error) {
		console.error('Error creating certificate template:', error);
		throw error;
	}
}

/**
 * Get certificate templates for an event (includes default templates)
 */
export async function getCertificateTemplates(
	eventId: string,
	userId?: string
) {
	try {
		await connectToDatabase();

		// Check if default templates exist, if not create them
		const existingDefaultTemplates = await CertificateTemplate.countDocuments({
			event: eventId,
			templateType: 'generated',
		});

		if (existingDefaultTemplates === 0 && userId) {
			await createDefaultTemplates(eventId, userId);
		}

		const templates = await CertificateTemplate.find({
			event: eventId,
			isActive: true,
		})
			.populate('createdBy', 'firstName lastName email')
			.sort({ templateType: 1, createdAt: -1 }); // Show generated templates first

		return JSON.parse(JSON.stringify(templates));
	} catch (error) {
		console.error('Error getting certificate templates:', error);
		throw error;
	}
}

/**
 * Get a specific certificate template
 */
export async function getCertificateTemplate(templateId: string) {
	try {
		await connectToDatabase();

		const template = await CertificateTemplate.findById(templateId)
			.populate('event', 'title description startDate endDate')
			.populate('createdBy', 'firstName lastName email');

		if (!template) {
			throw new Error('Certificate template not found');
		}

		return JSON.parse(JSON.stringify(template));
	} catch (error) {
		console.error('Error getting certificate template:', error);
		throw error;
	}
}

/**
 * Update certificate template
 */
export async function updateCertificateTemplate(
	templateId: string,
	updates: Partial<CreateCertificateTemplateParams>
) {
	try {
		await connectToDatabase();

		const template = await CertificateTemplate.findByIdAndUpdate(
			templateId,
			updates,
			{ new: true }
		);

		if (!template) {
			throw new Error('Certificate template not found');
		}

		revalidatePath(`/event/${template.event}/certificates`);
		return JSON.parse(JSON.stringify(template));
	} catch (error) {
		console.error('Error updating certificate template:', error);
		throw error;
	}
}

/**
 * Generate a single certificate
 */
export async function generateCertificate(params: GenerateCertificateParams) {
	try {
		await connectToDatabase();

		// Get template, stakeholder, event, and organizer
		const template = await CertificateTemplate.findById(
			params.templateId
		).populate('event');
		const stakeholder = await Stakeholder.findById(params.stakeholderId);
		const event = await Event.findById(template?.event._id);
		const organizer = await User.findById(event?.organizer);

		if (!template || !stakeholder || !event || !organizer) {
			throw new Error('Template, stakeholder, event, or organizer not found');
		}

		// Check if certificate already exists
		const existingCertificate = await Certificate.findOne({
			template: params.templateId,
			stakeholder: params.stakeholderId,
		});

		if (existingCertificate) {
			throw new Error('Certificate already exists for this stakeholder');
		}

		// Generate certificate PDF/image
		const certificateUrl = await generateCertificateFile(
			template,
			stakeholder,
			params.fieldValues,
			event,
			organizer
		);

		// Create certificate record
		const certificate = await Certificate.create({
			template: params.templateId,
			event: template.event._id,
			stakeholder: params.stakeholderId,
			certificateUrl,
			fieldValues: params.fieldValues,
		});

		// Update stakeholder
		await Stakeholder.findByIdAndUpdate(params.stakeholderId, {
			certificateGenerated: true,
			certificateId: certificate._id,
		});

		revalidatePath(`/event/${template.event._id}/certificates`);
		return JSON.parse(JSON.stringify(certificate));
	} catch (error) {
		console.error('Error generating certificate:', error);
		throw error;
	}
}

/**
 * Generate certificates in bulk
 */
export async function bulkGenerateCertificates(
	params: BulkGenerateCertificatesParams
) {
	try {
		await connectToDatabase();

		const template = await CertificateTemplate.findById(
			params.templateId
		).populate('event');
		if (!template) {
			throw new Error('Template not found');
		}

		const stakeholders = await Stakeholder.find({
			_id: { $in: params.stakeholderIds },
			certificateGenerated: false,
		});

		const results = [];

		for (const stakeholder of stakeholders) {
			try {
				// Merge default field values with stakeholder-specific values
				const fieldValues = {
					...params.defaultFieldValues,
					participantName: stakeholder.name,
					participantEmail: stakeholder.email,
					participantRole: stakeholder.role,
					eventName: template.event.title,
					eventDate: template.event.startDate.toDateString(),
				};

				const certificateUrl = await generateCertificateFile(
					template,
					stakeholder,
					fieldValues
				);

				const certificate = await Certificate.create({
					template: params.templateId,
					event: template.event._id,
					stakeholder: stakeholder._id,
					certificateUrl,
					fieldValues,
				});

				await Stakeholder.findByIdAndUpdate(stakeholder._id, {
					certificateGenerated: true,
					certificateId: certificate._id,
				});

				results.push({
					stakeholderId: stakeholder._id,
					stakeholderName: stakeholder.name,
					success: true,
					certificateId: certificate._id,
				});
			} catch (error) {
				results.push({
					stakeholderId: stakeholder._id,
					stakeholderName: stakeholder.name,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		revalidatePath(`/event/${template.event._id}/certificates`);
		return results;
	} catch (error) {
		console.error('Error bulk generating certificates:', error);
		throw error;
	}
}

/**
 * Get certificates for an event
 */
export async function getEventCertificates(eventId: string) {
	try {
		await connectToDatabase();

		const certificates = await Certificate.find({ event: eventId })
			.populate('template', 'name templateType')
			.populate('stakeholder', 'name email role')
			.sort({ generatedAt: -1 });

		return JSON.parse(JSON.stringify(certificates));
	} catch (error) {
		console.error('Error getting event certificates:', error);
		throw error;
	}
}

/**
 * Helper function to generate certificate file
 */
async function generateCertificateFile(
	template: any,
	stakeholder: any,
	fieldValues: { [key: string]: string },
	event: any,
	organizer: any
): Promise<string> {
	try {
		if (template.templateType === 'generated') {
			// Generate HTML certificate for default templates
			const htmlContent = generateDefaultCertificateContent(
				template,
				stakeholder,
				event,
				organizer
			);

			// In a real implementation, you would convert HTML to PDF
			// For now, we'll store the HTML content and return a URL
			// You could use libraries like puppeteer or html-pdf for PDF generation

			// Placeholder URL - in production, upload the generated PDF to storage
			return `https://certificates.example.com/generated/${template._id}/${stakeholder._id}.pdf`;
		} else {
			// Handle uploaded template files
			// 1. Load the template file
			// 2. Apply the field values at specified coordinates
			// 3. Generate a new PDF/image file
			// 4. Upload to storage and return URL

			// For now, return a placeholder URL
			return `https://certificates.example.com/${template._id}/${stakeholder._id}.pdf`;
		}
	} catch (error) {
		console.error('Error generating certificate file:', error);
		throw error;
	}
}

/**
 * Delete certificate template
 */
export async function deleteCertificateTemplate(templateId: string) {
	try {
		await connectToDatabase();

		const template = await CertificateTemplate.findByIdAndUpdate(
			templateId,
			{ isActive: false },
			{ new: true }
		);

		if (!template) {
			throw new Error('Certificate template not found');
		}

		revalidatePath(`/event/${template.event}/certificates`);
		return { success: true };
	} catch (error) {
		console.error('Error deleting certificate template:', error);
		throw error;
	}
}

/**
 * Auto-generate certificates for stakeholders based on their role
 */
export async function autoGenerateCertificates(
	eventId: string,
	userId: string
) {
	try {
		await connectToDatabase();

		// Ensure default templates exist
		await getCertificateTemplates(eventId, userId);

		// Get all stakeholders who attended the event
		const stakeholders = await Stakeholder.find({
			event: eventId,
			attendanceStatus: 'attended',
			certificateGenerated: false,
		});

		const results = [];

		for (const stakeholder of stakeholders) {
			try {
				// Find appropriate template based on role
				const template = await CertificateTemplate.findOne({
					event: eventId,
					templateType: 'generated',
					name: {
						$regex: new RegExp(stakeholder.role, 'i'),
					},
				});

				// Fallback to participation certificate if no role-specific template found
				const fallbackTemplate = await CertificateTemplate.findOne({
					event: eventId,
					templateType: 'generated',
					name: 'Participation Certificate',
				});

				const selectedTemplate = template || fallbackTemplate;

				if (!selectedTemplate) {
					results.push({
						stakeholder: stakeholder._id,
						success: false,
						error: 'No suitable template found',
					});
					continue;
				}

				// Generate default field values
				const fieldValues = {
					participantName: stakeholder.name,
					participantRole: stakeholder.role,
					eventName: '',
					eventDate: '',
					organizerSignature: '',
				};

				// Generate certificate
				const certificate = await generateCertificate({
					templateId: selectedTemplate._id.toString(),
					stakeholderId: stakeholder._id.toString(),
					fieldValues,
				});

				results.push({
					stakeholder: stakeholder._id,
					certificate: certificate._id,
					success: true,
				});
			} catch (error) {
				results.push({
					stakeholder: stakeholder._id,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		revalidatePath(`/event/${eventId}/certificates`);
		return results;
	} catch (error) {
		console.error('Error auto-generating certificates:', error);
		throw error;
	}
}
