import { Schema, model, models, Document } from 'mongoose';

// Interface for QR Code
export interface IQRCode extends Document {
  _id: string;
  event: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  order?: Schema.Types.ObjectId;
  ticketId: string; // Unique ticket identifier
  qrCodeData: string; // The actual QR code data/URL
  qrCodeImage?: string; // Base64 encoded QR code image
  type: 'ticket' | 'checkin' | 'access';
  status: 'active' | 'used' | 'expired' | 'cancelled';
  scannedAt?: Date;
  scannedBy?: Schema.Types.ObjectId;
  expiresAt?: Date;
  metadata: {
    ticketType?: string;
    seatNumber?: string;
    section?: string;
    additionalInfo?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// QR Code Schema
const qrCodeSchema = new Schema<IQRCode>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    qrCodeData: {
      type: String,
      required: true,
    },
    qrCodeImage: {
      type: String, // Base64 encoded image
    },
    type: {
      type: String,
      enum: ['ticket', 'checkin', 'access'],
      default: 'ticket',
    },
    status: {
      type: String,
      enum: ['active', 'used', 'expired', 'cancelled'],
      default: 'active',
    },
    scannedAt: {
      type: Date,
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
    metadata: {
      ticketType: { type: String },
      seatNumber: { type: String },
      section: { type: String },
      additionalInfo: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
qrCodeSchema.index({ event: 1, user: 1 });
qrCodeSchema.index({ ticketId: 1 }, { unique: true });
qrCodeSchema.index({ qrCodeData: 1 });
qrCodeSchema.index({ status: 1 });
qrCodeSchema.index({ expiresAt: 1 });

// Models
export const QRCode = models.QRCode || model<IQRCode>('QRCode', qrCodeSchema);

export default QRCode;
