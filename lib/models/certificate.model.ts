import { Schema, model, models, Document } from 'mongoose';

// Interface for certificate template fields
export interface ICertificateField {
	id: string;
	name: string;
	type: 'text' | 'date' | 'signature' | 'image';
	x: number; // X coordinate on template
	y: number; // Y coordinate on template
	width?: number;
	height?: number;
	fontSize?: number;
	fontFamily?: string;
	color?: string;
	required: boolean;
}

// Interface for certificate template
export interface ICertificateTemplate extends Document {
	_id: string;
	event: Schema.Types.ObjectId;
	name: string;
	description?: string;
	templateUrl: string; // URL to uploaded template file or 'generated' for default templates
	templateType: 'pdf' | 'image' | 'generated';
	fields: ICertificateField[];
	defaultValues?: { [key: string]: string }; // Default field values for generated templates
	isActive: boolean;
	createdBy: Schema.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

// Interface for generated certificate
export interface ICertificate extends Document {
	_id: string;
	template: Schema.Types.ObjectId;
	event: Schema.Types.ObjectId;
	stakeholder: Schema.Types.ObjectId;
	certificateUrl: string; // URL to generated certificate
	fieldValues: { [fieldId: string]: string };
	generatedAt: Date;
	emailSent: boolean;
	emailSentAt?: Date;
	downloadCount: number;
	lastDownloadAt?: Date;
}

// Certificate Template Schema
const certificateTemplateSchema = new Schema<ICertificateTemplate>(
	{
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		templateUrl: {
			type: String,
			required: true,
		},
		templateType: {
			type: String,
			enum: ['pdf', 'image', 'generated'],
			required: true,
		},
		fields: [
			{
				id: { type: String, required: true },
				name: { type: String, required: true },
				type: {
					type: String,
					enum: ['text', 'date', 'signature', 'image'],
					required: true,
				},
				x: { type: Number, required: true },
				y: { type: Number, required: true },
				width: { type: Number },
				height: { type: Number },
				fontSize: { type: Number, default: 12 },
				fontFamily: { type: String, default: 'Arial' },
				color: { type: String, default: '#000000' },
				required: { type: Boolean, default: true },
			},
		],
		defaultValues: {
			type: Map,
			of: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Certificate Schema
const certificateSchema = new Schema<ICertificate>(
	{
		template: {
			type: Schema.Types.ObjectId,
			ref: 'CertificateTemplate',
			required: true,
		},
		event: {
			type: Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		stakeholder: {
			type: Schema.Types.ObjectId,
			ref: 'Stakeholder',
			required: true,
		},
		certificateUrl: {
			type: String,
			required: true,
		},
		fieldValues: {
			type: Map,
			of: String,
			required: true,
		},
		generatedAt: {
			type: Date,
			default: Date.now,
		},
		emailSent: {
			type: Boolean,
			default: false,
		},
		emailSentAt: {
			type: Date,
		},
		downloadCount: {
			type: Number,
			default: 0,
		},
		lastDownloadAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
certificateTemplateSchema.index({ event: 1, isActive: 1 });
certificateSchema.index({ event: 1, stakeholder: 1 });
certificateSchema.index({ template: 1 });

// Models
export const CertificateTemplate =
	models.CertificateTemplate ||
	model<ICertificateTemplate>('CertificateTemplate', certificateTemplateSchema);
export const Certificate =
	models.Certificate || model<ICertificate>('Certificate', certificateSchema);

export default { CertificateTemplate, Certificate };
