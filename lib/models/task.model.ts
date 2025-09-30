import { Schema, model, models, Document } from 'mongoose';

// Interface for Subtask
export interface ISubtask {
  id: string;
  content: string;
  completed: boolean;
}

// Interface for Task
export interface ITask extends Document {
  _id: string;
  id: string; // Custom ID for frontend compatibility
  content: string;
  column: 'planning' | 'developing' | 'reviewing' | 'finished';
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  completed: boolean;
  subtasks: ISubtask[];
  event: Schema.Types.ObjectId;
  organizer: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Subtask Schema
const subtaskSchema = new Schema<ISubtask>({
  id: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

// Task Schema
const taskSchema = new Schema<ITask>(
  {
    id: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    column: {
      type: String,
      enum: ['planning', 'developing', 'reviewing', 'finished'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    estimatedDuration: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    subtasks: [subtaskSchema],
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient querying
taskSchema.index({ event: 1, organizer: 1 });

const Task = models.Task || model<ITask>('Task', taskSchema);

export default Task;
