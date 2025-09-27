'use server';

import { connectToDatabase } from '../dbconnection';
import { CertificateTemplate } from '../models/certificate.model';
import { ICertificateField } from '../models/certificate.model';

// Default certificate templates configuration
export const DEFAULT_TEMPLATES = [
  {
    name: 'Attendance Certificate',
    description: 'Standard certificate for event attendees',
    templateType: 'generated' as const,
    fields: [
      {
        id: 'title',
        name: 'Certificate Title',
        type: 'text' as const,
        x: 50,
        y: 20,
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#1a365d',
        required: true,
      },
      {
        id: 'participantName',
        name: 'Participant Name',
        type: 'text' as const,
        x: 50,
        y: 40,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: true,
      },
      {
        id: 'eventName',
        name: 'Event Name',
        type: 'text' as const,
        x: 50,
        y: 55,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventDate',
        name: 'Event Date',
        type: 'date' as const,
        x: 50,
        y: 65,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#718096',
        required: true,
      },
      {
        id: 'organizerSignature',
        name: 'Organizer Signature',
        type: 'text' as const,
        x: 70,
        y: 85,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: false,
      },
    ],
    defaultValues: {
      title: 'Certificate of Attendance',
    },
  },
  {
    name: 'Speaker Certificate',
    description: 'Certificate for event speakers and presenters',
    templateType: 'generated' as const,
    fields: [
      {
        id: 'title',
        name: 'Certificate Title',
        type: 'text' as const,
        x: 50,
        y: 20,
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#744210',
        required: true,
      },
      {
        id: 'participantName',
        name: 'Speaker Name',
        type: 'text' as const,
        x: 50,
        y: 40,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: true,
      },
      {
        id: 'recognition',
        name: 'Recognition Text',
        type: 'text' as const,
        x: 50,
        y: 50,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventName',
        name: 'Event Name',
        type: 'text' as const,
        x: 50,
        y: 60,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventDate',
        name: 'Event Date',
        type: 'date' as const,
        x: 50,
        y: 70,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#718096',
        required: true,
      },
      {
        id: 'organizerSignature',
        name: 'Organizer Signature',
        type: 'text' as const,
        x: 70,
        y: 85,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: false,
      },
    ],
    defaultValues: {
      title: 'Certificate of Recognition',
      recognition: 'for outstanding contribution as a speaker',
    },
  },
  {
    name: 'Volunteer Certificate',
    description: 'Certificate for event volunteers',
    templateType: 'generated' as const,
    fields: [
      {
        id: 'title',
        name: 'Certificate Title',
        type: 'text' as const,
        x: 50,
        y: 20,
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#22543d',
        required: true,
      },
      {
        id: 'participantName',
        name: 'Volunteer Name',
        type: 'text' as const,
        x: 50,
        y: 40,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: true,
      },
      {
        id: 'appreciation',
        name: 'Appreciation Text',
        type: 'text' as const,
        x: 50,
        y: 50,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventName',
        name: 'Event Name',
        type: 'text' as const,
        x: 50,
        y: 60,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventDate',
        name: 'Event Date',
        type: 'date' as const,
        x: 50,
        y: 70,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#718096',
        required: true,
      },
      {
        id: 'organizerSignature',
        name: 'Organizer Signature',
        type: 'text' as const,
        x: 70,
        y: 85,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: false,
      },
    ],
    defaultValues: {
      title: 'Certificate of Appreciation',
      appreciation: 'for dedicated volunteer service',
    },
  },
  {
    name: 'Participation Certificate',
    description: 'General participation certificate for all roles',
    templateType: 'generated' as const,
    fields: [
      {
        id: 'title',
        name: 'Certificate Title',
        type: 'text' as const,
        x: 50,
        y: 20,
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#553c9a',
        required: true,
      },
      {
        id: 'participantName',
        name: 'Participant Name',
        type: 'text' as const,
        x: 50,
        y: 40,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: true,
      },
      {
        id: 'participantRole',
        name: 'Participant Role',
        type: 'text' as const,
        x: 50,
        y: 50,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventName',
        name: 'Event Name',
        type: 'text' as const,
        x: 50,
        y: 60,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#4a5568',
        required: true,
      },
      {
        id: 'eventDate',
        name: 'Event Date',
        type: 'date' as const,
        x: 50,
        y: 70,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#718096',
        required: true,
      },
      {
        id: 'organizerSignature',
        name: 'Organizer Signature',
        type: 'text' as const,
        x: 70,
        y: 85,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#2d3748',
        required: false,
      },
    ],
    defaultValues: {
      title: 'Certificate of Participation',
    },
  },
];

/**
 * Create default certificate templates for an event
 */
export async function createDefaultTemplates(eventId: string, createdBy: string) {
  try {
    await connectToDatabase();

    const templates = [];

    for (const template of DEFAULT_TEMPLATES) {
      const existingTemplate = await CertificateTemplate.findOne({
        event: eventId,
        name: template.name,
        templateType: 'generated',
      });

      if (!existingTemplate) {
        const newTemplate = await CertificateTemplate.create({
          event: eventId,
          name: template.name,
          description: template.description,
          templateUrl: 'generated', // Special marker for generated templates
          templateType: 'generated',
          fields: template.fields,
          defaultValues: template.defaultValues,
          isActive: true,
          createdBy,
        });

        templates.push(newTemplate);
      }
    }

    return JSON.parse(JSON.stringify(templates));
  } catch (error) {
    console.error('Error creating default templates:', error);
    throw error;
  }
}

/**
 * Get default template by role
 */
export function getDefaultTemplateByRole(role: string) {
  switch (role.toLowerCase()) {
    case 'speaker':
      return DEFAULT_TEMPLATES.find(t => t.name === 'Speaker Certificate');
    case 'volunteer':
      return DEFAULT_TEMPLATES.find(t => t.name === 'Volunteer Certificate');
    case 'attendee':
      return DEFAULT_TEMPLATES.find(t => t.name === 'Attendance Certificate');
    default:
      return DEFAULT_TEMPLATES.find(t => t.name === 'Participation Certificate');
  }
}

/**
 * Generate certificate content using default template
 */
export function generateDefaultCertificateContent(
  template: any,
  stakeholder: any,
  event: any,
  organizer: any
): string {
  const fieldValues: { [key: string]: string } = {
    ...template.defaultValues,
    participantName: stakeholder.name,
    participantRole: stakeholder.role,
    eventName: event.title,
    eventDate: new Date(event.startDate).toLocaleDateString(),
    organizerSignature: `${organizer.firstName} ${organizer.lastName}`,
  };

  // Generate simple HTML certificate
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .certificate {
          background: white;
          padding: 60px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 800px;
          width: 100%;
          border: 8px solid #f7fafc;
        }
        .title { 
          font-size: 48px; 
          font-weight: bold; 
          color: ${template.fields.find((f: any) => f.id === 'title')?.color || '#1a365d'};
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .subtitle {
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 40px;
        }
        .name { 
          font-size: 36px; 
          font-weight: bold; 
          color: #2d3748;
          margin: 30px 0;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }
        .event { 
          font-size: 24px; 
          color: #4a5568;
          margin: 20px 0;
        }
        .date { 
          font-size: 16px; 
          color: #718096;
          margin: 20px 0;
        }
        .signature {
          margin-top: 60px;
          font-size: 14px;
          color: #2d3748;
        }
        .decoration {
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          margin: 20px auto;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="title">${fieldValues.title}</div>
        <div class="subtitle">This is to certify that</div>
        <div class="name">${fieldValues.participantName}</div>
        <div class="subtitle">
          ${fieldValues.recognition || fieldValues.appreciation || `has successfully participated as a ${fieldValues.participantRole}`}
        </div>
        <div class="decoration"></div>
        <div class="event">${fieldValues.eventName}</div>
        <div class="date">${fieldValues.eventDate}</div>
        <div class="signature">
          <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            ${fieldValues.organizerSignature}<br>
            <small>Event Organizer</small>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
