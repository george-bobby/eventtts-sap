'use server';

import { connectToDatabase } from '../dbconnection';
import QRCode, { IQRCode } from '../models/qrcode.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import * as qrcode from 'qrcode';

export interface CreateQRCodeParams {
  eventId: string;
  userId: string;
  orderId?: string;
  type?: 'ticket' | 'checkin' | 'access';
  metadata?: {
    ticketType?: string;
    seatNumber?: string;
    section?: string;
    additionalInfo?: string;
  };
  expiresAt?: Date;
}

export interface GetQRCodesParams {
  eventId: string;
  userId?: string;
  status?: 'active' | 'used' | 'expired' | 'cancelled';
  type?: 'ticket' | 'checkin' | 'access';
}

export interface ScanQRCodeParams {
  qrCodeData: string;
  scannedBy: string;
}

/**
 * Generate a unique ticket ID
 */
function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const randomId = nanoid(8);
  return `TKT-${timestamp}-${randomId}`.toUpperCase();
}

/**
 * Create a new QR code for a ticket
 */
export async function createQRCode(params: CreateQRCodeParams) {
  try {
    await connectToDatabase();

    // Verify event exists
    const event = await Event.findById(params.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify user exists
    const user = await User.findById(params.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate unique ticket ID
    const ticketId = generateTicketId();

    // Create QR code data (this could be a URL to verify the ticket)
    const qrCodeData = `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-ticket/${ticketId}`;

    // Generate QR code image as base64
    const qrCodeImage = await qrcode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });

    // Set expiration date (default to event end date + 1 day)
    const expiresAt = params.expiresAt || new Date(event.endDate.getTime() + 24 * 60 * 60 * 1000);

    const qrCodeDoc = await QRCode.create({
      event: params.eventId,
      user: params.userId,
      order: params.orderId,
      ticketId,
      qrCodeData,
      qrCodeImage,
      type: params.type || 'ticket',
      status: 'active',
      expiresAt,
      metadata: params.metadata || {},
    });

    revalidatePath(`/event/${params.eventId}/qr-code`);
    return JSON.parse(JSON.stringify(qrCodeDoc));
  } catch (error) {
    console.error('Error creating QR code:', error);
    throw error;
  }
}

/**
 * Get QR codes for an event or user
 */
export async function getQRCodes(params: GetQRCodesParams) {
  try {
    await connectToDatabase();

    const query: any = { event: params.eventId };
    
    if (params.userId) {
      query.user = params.userId;
    }
    
    if (params.status) {
      query.status = params.status;
    }
    
    if (params.type) {
      query.type = params.type;
    }

    const qrCodes = await QRCode.find(query)
      .populate('event', 'title startDate endDate')
      .populate('user', 'firstName lastName email')
      .populate('order', 'stripeId totalTickets totalAmount')
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(qrCodes));
  } catch (error) {
    console.error('Error getting QR codes:', error);
    throw error;
  }
}

/**
 * Get a specific QR code by ticket ID
 */
export async function getQRCodeByTicketId(ticketId: string) {
  try {
    await connectToDatabase();

    const qrCode = await QRCode.findOne({ ticketId })
      .populate('event', 'title startDate endDate location')
      .populate('user', 'firstName lastName email')
      .populate('order', 'stripeId totalTickets totalAmount');

    if (!qrCode) {
      throw new Error('QR code not found');
    }

    return JSON.parse(JSON.stringify(qrCode));
  } catch (error) {
    console.error('Error getting QR code by ticket ID:', error);
    throw error;
  }
}

/**
 * Scan and validate a QR code
 */
export async function scanQRCode(params: ScanQRCodeParams) {
  try {
    await connectToDatabase();

    // Extract ticket ID from QR code data
    const ticketId = params.qrCodeData.split('/').pop();
    if (!ticketId) {
      throw new Error('Invalid QR code format');
    }

    const qrCode = await QRCode.findOne({ ticketId })
      .populate('event', 'title startDate endDate')
      .populate('user', 'firstName lastName email');

    if (!qrCode) {
      return {
        success: false,
        message: 'Invalid QR code',
      };
    }

    // Check if already used
    if (qrCode.status === 'used') {
      return {
        success: false,
        message: 'QR code already used',
        qrCode: JSON.parse(JSON.stringify(qrCode)),
      };
    }

    // Check if expired
    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      await QRCode.findByIdAndUpdate(qrCode._id, { status: 'expired' });
      return {
        success: false,
        message: 'QR code expired',
        qrCode: JSON.parse(JSON.stringify(qrCode)),
      };
    }

    // Check if cancelled
    if (qrCode.status === 'cancelled') {
      return {
        success: false,
        message: 'QR code cancelled',
        qrCode: JSON.parse(JSON.stringify(qrCode)),
      };
    }

    // Mark as used
    const updatedQRCode = await QRCode.findByIdAndUpdate(
      qrCode._id,
      {
        status: 'used',
        scannedAt: new Date(),
        scannedBy: params.scannedBy,
      },
      { new: true }
    ).populate('event', 'title startDate endDate')
     .populate('user', 'firstName lastName email');

    return {
      success: true,
      message: 'QR code scanned successfully',
      qrCode: JSON.parse(JSON.stringify(updatedQRCode)),
    };
  } catch (error) {
    console.error('Error scanning QR code:', error);
    throw error;
  }
}

/**
 * Generate QR codes for all attendees of an event
 */
export async function generateQRCodesForEvent(eventId: string, organizerId: string) {
  try {
    await connectToDatabase();

    // Verify event exists and user is organizer
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (String(event.organizer) !== organizerId) {
      throw new Error('Unauthorized: Only event organizer can generate QR codes');
    }

    // Get all orders for this event
    const orders = await Order.find({ event: eventId }).populate('user');

    const results = [];
    
    for (const order of orders) {
      // Generate QR codes for each ticket in the order
      for (let i = 0; i < order.totalTickets; i++) {
        try {
          const qrCode = await createQRCode({
            eventId,
            userId: order.user._id,
            orderId: order._id,
            type: 'ticket',
            metadata: {
              ticketType: 'General Admission',
              additionalInfo: `Ticket ${i + 1} of ${order.totalTickets}`,
            },
          });
          results.push(qrCode);
        } catch (error) {
          console.error(`Error creating QR code for order ${order._id}:`, error);
        }
      }
    }

    revalidatePath(`/event/${eventId}/qr-code`);
    return results;
  } catch (error) {
    console.error('Error generating QR codes for event:', error);
    throw error;
  }
}

/**
 * Delete a QR code
 */
export async function deleteQRCode(qrCodeId: string, userId: string) {
  try {
    await connectToDatabase();

    const qrCode = await QRCode.findById(qrCodeId).populate('event');
    if (!qrCode) {
      throw new Error('QR code not found');
    }

    // Check if user is the organizer of the event
    if (String(qrCode.event.organizer) !== userId) {
      throw new Error('Unauthorized: Only event organizer can delete QR codes');
    }

    await QRCode.findByIdAndDelete(qrCodeId);
    revalidatePath(`/event/${qrCode.event._id}/qr-code`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting QR code:', error);
    throw error;
  }
}
