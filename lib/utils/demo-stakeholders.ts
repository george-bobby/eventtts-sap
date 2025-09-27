import { connectToDatabase } from '@/lib/dbconnection';
import { Stakeholder } from '@/lib/models/stakeholder.model';
import Event from '@/lib/models/event.model';
import mongoose from 'mongoose';

/**
 * Create demo stakeholders for testing
 * This function can be called from an API route or admin panel
 */
export async function createDemoStakeholders(eventId: string, userId: string) {
  try {
    await connectToDatabase();

    // Verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const demoStakeholders = [
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'attendee',
        attendanceStatus: 'registered',
        additionalInfo: {
          company: 'Tech Solutions Inc.',
          title: 'Software Developer',
          phone: '+1234567890',
          notes: 'Interested in AI workshops'
        },
        emailsSent: {
          welcome: true,
          reminder: false,
          thankYou: false,
          certificate: false,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'speaker',
        attendanceStatus: 'attended',
        additionalInfo: {
          company: 'Innovation Labs',
          title: 'Data Scientist',
          phone: '+1234567891',
          notes: 'Keynote speaker for machine learning session'
        },
        certificateGenerated: true,
        emailsSent: {
          welcome: true,
          reminder: true,
          thankYou: true,
          certificate: true,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        role: 'volunteer',
        attendanceStatus: 'attended',
        additionalInfo: {
          company: 'Community Volunteers',
          title: 'Event Coordinator',
          phone: '+1234567892',
          notes: 'Helping with registration desk'
        },
        certificateGenerated: true,
        emailsSent: {
          welcome: true,
          reminder: true,
          thankYou: true,
          certificate: false,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        role: 'organizer',
        attendanceStatus: 'attended',
        additionalInfo: {
          company: 'Event Management Pro',
          title: 'Senior Event Manager',
          phone: '+1234567893',
          notes: 'Lead organizer for the event'
        },
        certificateGenerated: true,
        emailsSent: {
          welcome: true,
          reminder: true,
          thankYou: true,
          certificate: true,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'David Brown',
        email: 'david.brown@example.com',
        role: 'sponsor',
        attendanceStatus: 'registered',
        additionalInfo: {
          company: 'Corporate Sponsors LLC',
          title: 'Marketing Director',
          phone: '+1234567894',
          notes: 'Gold sponsor representative'
        },
        emailsSent: {
          welcome: true,
          reminder: true,
          thankYou: false,
          certificate: false,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        role: 'attendee',
        attendanceStatus: 'no-show',
        additionalInfo: {
          company: 'Startup Hub',
          title: 'Product Manager',
          phone: '+1234567895',
          notes: 'Registered but did not attend'
        },
        emailsSent: {
          welcome: true,
          reminder: true,
          thankYou: false,
          certificate: false,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'Alex Chen',
        email: 'alex.chen@example.com',
        role: 'attendee',
        attendanceStatus: 'cancelled',
        additionalInfo: {
          company: 'Digital Agency',
          title: 'UX Designer',
          phone: '+1234567896',
          notes: 'Cancelled due to scheduling conflict'
        },
        emailsSent: {
          welcome: true,
          reminder: false,
          thankYou: false,
          certificate: false,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
      {
        event: new mongoose.Types.ObjectId(eventId),
        name: 'Lisa Rodriguez',
        email: 'lisa.rodriguez@example.com',
        role: 'speaker',
        attendanceStatus: 'attended',
        additionalInfo: {
          company: 'Tech University',
          title: 'Professor of Computer Science',
          phone: '+1234567897',
          notes: 'Panel discussion facilitator'
        },
        certificateGenerated: true,
        emailsSent: {
          welcome: true,
          reminder: true,
          thankYou: true,
          certificate: true,
        },
        importedBy: new mongoose.Types.ObjectId(userId),
      },
    ];

    // Delete existing demo stakeholders to avoid duplicates
    await Stakeholder.deleteMany({
      event: eventId,
      email: { $in: demoStakeholders.map(s => s.email) }
    });

    // Create new demo stakeholders
    const created = await Stakeholder.insertMany(demoStakeholders);

    return {
      success: true,
      message: `Created ${created.length} demo stakeholders`,
      stakeholders: created,
    };
  } catch (error) {
    console.error('Error creating demo stakeholders:', error);
    throw error;
  }
}