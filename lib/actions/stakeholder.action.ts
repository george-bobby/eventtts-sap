'use server';

import mongoose from 'mongoose';
import { connectToDatabase } from '../dbconnection';
import { Stakeholder, StakeholderImport } from '../models/stakeholder.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export interface CreateStakeholderParams {
  eventId: string;
  name: string;
  email: string;
  role: 'attendee' | 'speaker' | 'volunteer' | 'organizer' | 'sponsor';
  attendanceStatus?: 'registered' | 'attended' | 'no-show' | 'cancelled';
  additionalInfo?: {
    company?: string;
    title?: string;
    phone?: string;
    notes?: string;
  };
  importedBy: string;
}

export interface BulkImportStakeholdersParams {
  eventId: string;
  fileUrl: string;
  fileName: string;
  importedBy: string;
}

export interface UpdateStakeholderParams {
  stakeholderId: string;
  updates: Partial<CreateStakeholderParams>;
}

/**
 * Create a single stakeholder
 */
export async function createStakeholder(params: CreateStakeholderParams) {
  try {
    await connectToDatabase();

    // Check if stakeholder already exists for this event
    const existingStakeholder = await Stakeholder.findOne({
      event: new mongoose.Types.ObjectId(params.eventId),
      email: params.email,
    });

    if (existingStakeholder) {
      throw new Error('Stakeholder with this email already exists for this event');
    }

    // Check if user exists with this email
    const existingUser = await User.findOne({ email: params.email });

    const stakeholder = await Stakeholder.create({
      ...params,
      event: new mongoose.Types.ObjectId(params.eventId),
      user: existingUser?._id,
    });

    revalidatePath(`/event/${params.eventId}/stakeholders`);
    return JSON.parse(JSON.stringify(stakeholder));
  } catch (error) {
    console.error('Error creating stakeholder:', error);
    throw error;
  }
}

/**
 * Get stakeholders for an event
 */
export async function getEventStakeholders(eventId: string, filters?: {
  role?: string;
  attendanceStatus?: string;
  search?: string;
}) {
  try {
    await connectToDatabase();

    let query: any = { event: new mongoose.Types.ObjectId(eventId) };

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.attendanceStatus) {
      query.attendanceStatus = filters.attendanceStatus;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { 'additionalInfo.company': { $regex: filters.search, $options: 'i' } },
      ];
    }

    const stakeholders = await Stakeholder.find(query)
      .populate('user', 'firstName lastName photo')
      .populate('certificateId', 'certificateUrl generatedAt')
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(stakeholders));
  } catch (error) {
    console.error('Error getting event stakeholders:', error);
    throw error;
  }
}

/**
 * Get stakeholder by ID
 */
export async function getStakeholder(stakeholderId: string) {
  try {
    await connectToDatabase();

    const stakeholder = await Stakeholder.findById(stakeholderId)
      .populate('event', 'title description startDate endDate')
      .populate('user', 'firstName lastName email photo')
      .populate('certificateId', 'certificateUrl generatedAt emailSent');

    if (!stakeholder) {
      throw new Error('Stakeholder not found');
    }

    return JSON.parse(JSON.stringify(stakeholder));
  } catch (error) {
    console.error('Error getting stakeholder:', error);
    throw error;
  }
}

/**
 * Update stakeholder
 */
export async function updateStakeholder(params: UpdateStakeholderParams) {
  try {
    await connectToDatabase();

    const stakeholder = await Stakeholder.findByIdAndUpdate(
      params.stakeholderId,
      params.updates,
      { new: true }
    );

    if (!stakeholder) {
      throw new Error('Stakeholder not found');
    }

    revalidatePath(`/event/${stakeholder.event}/stakeholders`);
    return JSON.parse(JSON.stringify(stakeholder));
  } catch (error) {
    console.error('Error updating stakeholder:', error);
    throw error;
  }
}

/**
 * Delete stakeholder
 */
export async function deleteStakeholder(stakeholderId: string) {
  try {
    await connectToDatabase();

    const stakeholder = await Stakeholder.findByIdAndDelete(stakeholderId);

    if (!stakeholder) {
      throw new Error('Stakeholder not found');
    }

    revalidatePath(`/event/${stakeholder.event}/stakeholders`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting stakeholder:', error);
    throw error;
  }
}

/**
 * Bulk import stakeholders from CSV/Excel file
 */
export async function bulkImportStakeholders(params: BulkImportStakeholdersParams) {
  try {
    await connectToDatabase();

    // Create import record
    const importRecord = await StakeholderImport.create({
      event: params.eventId,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      totalRecords: 0,
      importedBy: params.importedBy,
      status: 'processing',
    });

    // Process file in background (simplified - in production, use a queue)
    processStakeholderFile(importRecord._id.toString(), params);

    return JSON.parse(JSON.stringify(importRecord));
  } catch (error) {
    console.error('Error starting bulk import:', error);
    throw error;
  }
}

/**
 * Process stakeholder file (simplified implementation)
 */
async function processStakeholderFile(importId: string, params: BulkImportStakeholdersParams) {
  try {
    // In a real implementation, you would:
    // 1. Download the file from the URL
    // 2. Parse CSV/Excel data
    // 3. Validate each row
    // 4. Create stakeholder records
    // 5. Update import status

    // Simplified example:
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'attendee',
        company: 'Tech Corp',
        title: 'Developer',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'speaker',
        company: 'Design Studio',
        title: 'Designer',
      },
    ];

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < sampleData.length; i++) {
      const row = sampleData[i];
      try {
        await createStakeholder({
          eventId: params.eventId,
          name: row.name,
          email: row.email,
          role: row.role as any,
          additionalInfo: {
            company: row.company,
            title: row.title,
          },
          importedBy: params.importedBy,
        });
        successCount++;
      } catch (error) {
        failCount++;
        errors.push({
          row: i + 1,
          field: 'general',
          value: row.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update import record
    await StakeholderImport.findByIdAndUpdate(importId, {
      totalRecords: sampleData.length,
      successfulImports: successCount,
      failedImports: failCount,
      errors,
      status: 'completed',
    });

    revalidatePath(`/event/${params.eventId}/stakeholders`);
  } catch (error) {
    console.error('Error processing stakeholder file:', error);
    
    await StakeholderImport.findByIdAndUpdate(importId, {
      status: 'failed',
      errors: [{
        row: 0,
        field: 'general',
        value: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
    });
  }
}

/**
 * Get import history for an event
 */
export async function getStakeholderImports(eventId: string) {
  try {
    await connectToDatabase();

    const imports = await StakeholderImport.find({ event: new mongoose.Types.ObjectId(eventId) })
      .populate('importedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(imports));
  } catch (error) {
    console.error('Error getting stakeholder imports:', error);
    throw error;
  }
}

/**
 * Get stakeholder statistics for an event
 */
export async function getStakeholderStats(eventId: string) {
  try {
    await connectToDatabase();

    const stats = await Stakeholder.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          certificatesGenerated: {
            $sum: { $cond: ['$certificateGenerated', 1, 0] },
          },
          attendedCount: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'attended'] }, 1, 0] },
          },
          noShowCount: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'no-show'] }, 1, 0] },
          },
          registeredCount: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'registered'] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      certificatesGenerated: 0,
      attendedCount: 0,
      noShowCount: 0,
      registeredCount: 0,
      cancelledCount: 0,
    };

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Error getting stakeholder stats:', error);
    throw error;
  }
}

/**
 * Update attendance status for multiple stakeholders
 */
export async function bulkUpdateAttendance(
  stakeholderIds: string[],
  attendanceStatus: 'registered' | 'attended' | 'no-show' | 'cancelled'
) {
  try {
    await connectToDatabase();

    const result = await Stakeholder.updateMany(
      { _id: { $in: stakeholderIds } },
      { attendanceStatus }
    );

    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error('Error bulk updating attendance:', error);
    throw error;
  }
}
