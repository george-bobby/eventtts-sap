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