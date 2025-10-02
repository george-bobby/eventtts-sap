'use client';
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Clock, AlertCircle, Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define types
interface Subtask {
  id: string;
  content: string;
  completed: boolean;
  assignee?: string;
}

interface Task {
  id: string;
  content: string;
  column: string;
  subtasks: Subtask[];
  priority?: 'high' | 'medium' | 'low';
  estimatedDuration?: string;
  completed: boolean;
}

interface EventPlannerProps {
  event: {
    _id: string;
    title: string;
    category: { name: string } | string;
    description: string;
    startDate: string;
    endDate: string;
    location?: string;
    isOnline?: boolean;
    totalCapacity?: number;
    isFree?: boolean;
    price?: number;
  };
  isSubEvent?: boolean;
}

// Draggable Subtask component
const SubtaskItem: React.FC<{
  subtask: Subtask;
  taskId: string;
  index: number;
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
  onEditSubtask: (taskId: string, subtaskId: string, content: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ subtask, taskId, index, onMoveSubtask, onEditSubtask, onDeleteSubtask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(subtask.content);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'subtask',
    item: { id: subtask.id, taskId, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== subtask.content) {
      onEditSubtask(taskId, subtask.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(subtask.content);
    setIsEditing(false);
  };

  return (
    <div
      ref={drag as any}
      className={`p-3 ml-4 mb-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg transition-all duration-150 group ${isDragging ? 'opacity-50 scale-95' : 'hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {subtask.content}
            </span>
          )}
        </div>

        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteSubtask(taskId, subtask.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Droppable area for subtasks inside a task
const SubtaskList: React.FC<{
  taskId: string;
  subtasks: Subtask[];
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
  onEditSubtask: (taskId: string, subtaskId: string, content: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ taskId, subtasks, onMoveSubtask, onEditSubtask, onDeleteSubtask }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'subtask',
    drop: (item: { id: string; taskId: string; index: number }) => {
      onMoveSubtask(item.id, item.taskId, taskId, subtasks.length);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop as any} className={`min-h-[50px] mt-2 ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded' : ''}`}>
      {subtasks.map((sub, idx) => (
        <SubtaskItem
          key={sub.id}
          subtask={sub}
          taskId={taskId}
          index={idx}
          onMoveSubtask={onMoveSubtask}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ))}
    </div>
  );
};

// Priority badge component
const PriorityBadge: React.FC<{ priority?: 'high' | 'medium' | 'low' }> = ({ priority }) => {
  if (!priority) return null;

  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Badge variant="outline" className={`text-xs ${colors[priority]}`}>
      {priority}
    </Badge>
  );
};

// Draggable and Droppable Task Card
const TaskCard: React.FC<{
  task: Task;
  onDropTask: (id: string, newColumn: string) => void;
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
  onEditTask: (taskId: string, content: string, priority?: string, estimatedDuration?: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditSubtask: (taskId: string, subtaskId: string, content: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ task, onDropTask, onMoveSubtask, onEditTask, onDeleteTask, onEditSubtask, onDeleteSubtask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [editPriority, setEditPriority] = useState(task.priority || 'medium');
  const [editDuration, setEditDuration] = useState(task.estimatedDuration || '');

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, column: task.column },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const totalSubtasks = task.subtasks.length;

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== task.content) {
      onEditTask(task.id, editContent.trim(), editPriority, editDuration);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(task.content);
    setEditPriority(task.priority || 'medium');
    setEditDuration(task.estimatedDuration || '');
    setIsEditing(false);
  };

  return (
    <div
      ref={drag as any}
      className={`p-4 mb-3 bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group ${isDragging ? 'opacity-50 rotate-2' : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Select value={editPriority} onValueChange={(value: "high" | "medium" | "low") => setEditPriority(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="Duration (e.g., 2 hours)"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <h4 className="font-semibold text-gray-900 cursor-move">
              {task.content}
            </h4>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteTask(task.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isEditing && task.estimatedDuration && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Clock className="h-3 w-3" />
          <span>{task.estimatedDuration}</span>
        </div>
      )}

      {!isEditing && totalSubtasks > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <span>{totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}</span>
        </div>
      )}

      {!isEditing && (
        <SubtaskList
          taskId={task.id}
          subtasks={task.subtasks}
          onMoveSubtask={onMoveSubtask}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      )}
    </div>
  );
};

// Column component
const Column: React.FC<{
  title: string;
  columnId: string;
  tasks: Task[];
  onDropTask: (id: string, newColumn: string) => void;
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
  onEditTask: (taskId: string, content: string, priority?: string, estimatedDuration?: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditSubtask: (taskId: string, subtaskId: string, content: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ title, columnId, tasks, onDropTask, onMoveSubtask, onEditTask, onDeleteTask, onEditSubtask, onDeleteSubtask }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: string; column: string }) => onDropTask(item.id, columnId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const getColumnColor = () => {
    switch (columnId) {
      case 'planning': return 'border-t-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50';
      case 'developing': return 'border-t-orange-500 bg-gradient-to-br from-orange-50 to-amber-50';
      case 'reviewing': return 'border-t-purple-500 bg-gradient-to-br from-purple-50 to-violet-50';
      case 'finished': return 'border-t-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50';
      default: return 'border-t-gray-500 bg-gradient-to-br from-gray-50 to-gray-100';
    }
  };

  return (
    <div ref={drop as any} className={`min-w-[320px] p-4 border-2 border-dashed border-transparent rounded-xl transition-all duration-200 ${isOver ? 'border-blue-400 bg-blue-50/50 shadow-lg scale-105' : 'hover:shadow-md'
      }`}>
      <div className={`bg-white rounded-xl p-5 shadow-lg border-t-4 ${getColumnColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold bg-white/70">
              {tasks.length}
            </Badge>
          </div>
        </div>
        <div className="space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDropTask={onDropTask}
              onMoveSubtask={onMoveSubtask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onEditSubtask={onEditSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-sm font-medium">No tasks yet</div>
              <div className="text-xs mt-1">Drag tasks here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main EventPlanner component
const EventPlanner: React.FC<EventPlannerProps> = ({ event, isSubEvent = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const { toast } = useToast();

  // Load tasks from database on mount
  useEffect(() => {
    loadTasks();
  }, [event._id]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks?eventId=${event._id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tasks.length > 0) {
          setTasks(data.tasks);
          setHasGenerated(true);
        } else {
          // No tasks exist, generate them automatically
          await handleGenerateTasks();
        }
      } else {
        // No tasks exist, generate them automatically
        await handleGenerateTasks();
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Fallback to generating tasks
      await handleGenerateTasks();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTasks = async (forceRegenerate = false) => {
    setIsGenerating(true);
    try {
      const categoryName = typeof event.category === 'string' ? event.category : event.category.name;

      const response = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: categoryName.toLowerCase(),
          eventTitle: event.title,
          eventDescription: event.description,
          isSubEvent,
          eventDetails: {
            location: event.location,
            isOnline: event.isOnline,
            capacity: event.totalCapacity,
            startDate: event.startDate,
            endDate: event.endDate,
            isFree: event.isFree,
            price: event.price,
            category: categoryName
          },
          eventId: event._id,
          forceRegenerate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const data = await response.json();

      if (data.success) {
        if (data.tasksExist && !forceRegenerate) {
          // Tasks already exist, load them
          await loadTasks();
          return;
        }

        // Convert to our Task format with completion tracking
        const newTasks: Task[] = data.tasks.map((task: any) => ({
          id: task.id,
          content: task.content,
          column: task.column,
          subtasks: task.subtasks.map((sub: any) => ({
            ...sub,
            completed: false
          })),
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          completed: false
        }));

        setTasks(newTasks);
        setHasGenerated(true);

        toast({
          title: "Tasks Generated Successfully! ✨",
          description: `Generated ${newTasks.length} tasks for ${isSubEvent ? 'sub-event' : 'event'}: "${event.title}".`,
        });
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast({
        title: "Error generating tasks",
        description: "Failed to generate tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDropTask = async (id: string, newColumn: string) => {
    // Optimistically update UI
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: newColumn } : t)));

    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          taskUpdates: [{ taskId: id, updates: { column: newColumn } }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: t.column } : t)));
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditTask = async (taskId: string, content: string, priority?: string, estimatedDuration?: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          content,
          priority,
          estimatedDuration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit task');
      }

      // Update local state
      setTasks((prev) => prev.map((task) =>
        task.id === taskId
          ? { ...task, content, priority: priority as any, estimatedDuration }
          : task
      ));

      toast({
        title: "Success",
        description: "Task updated successfully.",
      });
    } catch (error) {
      console.error('Error editing task:', error);
      toast({
        title: "Error",
        description: "Failed to edit task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?eventId=${event._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Update local state
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditSubtask = async (taskId: string, subtaskId: string, content: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit subtask');
      }

      // Update local state
      setTasks((prev) => prev.map((task) =>
        task.id === taskId
          ? {
            ...task,
            subtasks: task.subtasks.map((sub) =>
              sub.id === subtaskId ? { ...sub, content } : sub
            )
          }
          : task
      ));

      toast({
        title: "Success",
        description: "Subtask updated successfully.",
      });
    } catch (error) {
      console.error('Error editing subtask:', error);
      toast({
        title: "Error",
        description: "Failed to edit subtask. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      console.log('Deleting subtask:', { taskId, subtaskId, eventId: event._id });

      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}?eventId=${event._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Delete subtask failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
        throw new Error(errorData.error || errorData.message || `Failed to delete subtask (${response.status}: ${response.statusText})`);
      }

      // Update local state
      setTasks((prev) => prev.map((task) =>
        task.id === taskId
          ? {
            ...task,
            subtasks: task.subtasks.filter((sub) => sub.id !== subtaskId)
          }
          : task
      ));

      toast({
        title: "Success",
        description: "Subtask deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subtask. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMoveSubtask = (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => {
    setTasks((prev) => {
      let subtaskToMove: Subtask | undefined;
      const updatedTasks = prev.map((task) => {
        if (task.id === sourceTaskId) {
          const updatedSubtasks = task.subtasks.filter((sub) => {
            if (sub.id === subtaskId) {
              subtaskToMove = sub;
              return false;
            }
            return true;
          });
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });

      if (subtaskToMove) {
        return updatedTasks.map((task) => {
          if (task.id === targetTaskId) {
            const newSubtasks = [...task.subtasks];
            newSubtasks.splice(targetIndex, 0, subtaskToMove!);
            return { ...task, subtasks: newSubtasks };
          }
          return task;
        });
      }
      return updatedTasks;
    });
  };

  const columns = [
    { id: 'planning', title: 'Planning', icon: '📋' },
    { id: 'developing', title: 'In Progress', icon: '🔧' },
    { id: 'reviewing', title: 'Review', icon: '👁️' },
    { id: 'finished', title: 'Completed', icon: '✅' },
  ];

  const getTaskStats = () => {
    const total = tasks.length;
    const totalSubtasks = tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
    return { total, totalSubtasks };
  };

  const stats = getTaskStats();
  const categoryName = typeof event.category === 'string' ? event.category : event.category.name;

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Loading Event Tasks</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-generating tasks indicator */}
      {isGenerating && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">Generating AI-Powered Tasks</h3>
                <p className="text-emerald-700">Creating a personalized task list for your {categoryName.toLowerCase()} event...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Stats */}
      {tasks.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span><strong>{stats.total}</strong> tasks</span>
                <span><strong>{stats.totalSubtasks}</strong> subtasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Board */}
      {tasks.length > 0 && (
        <DndProvider backend={HTML5Backend}>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-inner">
            <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {columns.map((col) => (
                <Column
                  key={col.id}
                  title={`${col.icon} ${col.title}`}
                  columnId={col.id}
                  tasks={tasks.filter((task) => task.column === col.id)}
                  onDropTask={handleDropTask}
                  onMoveSubtask={handleMoveSubtask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onEditSubtask={handleEditSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
              ))}
            </div>
          </div>
        </DndProvider>
      )}

      {/* Empty State */}
      {tasks.length === 0 && hasGenerated && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks generated</h3>
          <p className="text-gray-600 mb-4">Something went wrong with task generation. Please try again.</p>
          <Button onClick={() => handleGenerateTasks(false)} disabled={isGenerating} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Generate Tasks
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventPlanner;