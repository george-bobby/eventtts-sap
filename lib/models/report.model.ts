// lib/models/report.model.ts

import { Document, Schema, model, models } from "mongoose";

export interface IReport extends Document {
  _id: string;
  preparedBy: string;
  eventPurpose: string;
  keyHighlights: string;
  majorOutcomes: string;
  objective: string;
  targetAudience: string;
  eventGoals: string;
  agenda: string;
  partners: string;
  budgetAllocation: string;
  vips: string;
  keySessions: string;
  photos: string;
  budget: string;
  sponsorship: string;
  actualExpenditure: string;
  generatedContent: string; // Field for Gemini's output
  event: { _id: string; title: string };
  organizer: { _id: string; firstName: string; lastName: string };
  createdAt: Date;
}

const ReportSchema = new Schema({
  preparedBy: { type: String, required: true },
  eventPurpose: { type: String, required: true },
  keyHighlights: { type: String, required: true },
  majorOutcomes: { type: String, required: true },
  objective: { type: String, required: true },
  targetAudience: { type: String, required: true },
  eventGoals: { type: String, required: true },
  agenda: { type: String, required: true },
  partners: { type: String },
  budgetAllocation: { type: String },
  vips: { type: String },
  keySessions: { type: String },
  photos: { type: String },
  budget: { type: String },
  sponsorship: { type: String },
  actualExpenditure: { type: String },
  generatedContent: { type: String }, // Field for Gemini's output
  event: { type: Schema.Types.ObjectId, ref: "Event" },
  organizer: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const Report = models.Report || model("Report", ReportSchema);

export default Report;