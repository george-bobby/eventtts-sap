'use client';
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock, AlertCircle, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
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
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ subtask, taskId, index, onMoveSubtask, onToggleSubtask }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'subtask',
    item: { id: subtask.id, taskId, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-3 ml-4 mb-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg cursor-move hover:shadow-sm transition-all duration-150 ${isDragging ? 'opacity-50 scale-95' : 'hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => onToggleSubtask(taskId, subtask.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
          />
          {subtask.completed && (
            <CheckCircle2 className="absolute -top-0.5 -left-0.5 h-5 w-5 text-blue-600 pointer-events-none" />
          )}
        </div>
        <span className={`text-sm font-medium transition-all ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
          }`}>
          {subtask.content}
        </span>
      </div>
    </div>
  );
};

// Droppable area for subtasks inside a task
const SubtaskList: React.FC<{
  taskId: string;
  subtasks: Subtask[];
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ taskId, subtasks, onMoveSubtask, onToggleSubtask }) => {
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
          onToggleSubtask={onToggleSubtask}
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
  onToggleTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ task, onDropTask, onMoveSubtask, onToggleTask, onToggleSubtask }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, column: task.column },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const completedSubtasks = task.subtasks.filter(sub => sub.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      ref={drag as any}
      className={`p-4 mb-3 bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-move transform hover:-translate-y-1 ${isDragging ? 'opacity-50 rotate-2' : ''
        } ${task.completed
          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
          : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
              className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-md transition-colors"
            />
            {task.completed && (
              <CheckCircle2 className="absolute -top-0.5 -left-0.5 h-6 w-6 text-emerald-600 pointer-events-none" />
            )}
          </div>
          <h4 className={`font-semibold flex-1 transition-all ${task.completed
            ? 'line-through text-gray-500'
            : 'text-gray-900'
            }`}>
            {task.content}
          </h4>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.estimatedDuration && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Clock className="h-3 w-3" />
          <span>{task.estimatedDuration}</span>
        </div>
      )}

      {totalSubtasks > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <span>Progress: {completedSubtasks}/{totalSubtasks} subtasks</span>
          <div className="w-16 bg-gray-200 rounded-full h-1 ml-2">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <SubtaskList
        taskId={task.id}
        subtasks={task.subtasks}
        onMoveSubtask={onMoveSubtask}
        onToggleSubtask={onToggleSubtask}
      />
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
  onToggleTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ title, columnId, tasks, onDropTask, onMoveSubtask, onToggleTask, onToggleSubtask }) => {
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

  const completedTasks = tasks.filter(task => task.completed).length;

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
            {tasks.length > 0 && (
              <Badge variant="outline" className="text-xs font-medium">
                {completedTasks}/{tasks.length}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDropTask={onDropTask}
              onMoveSubtask={onMoveSubtask}
              onToggleTask={onToggleTask}
              onToggleSubtask={onToggleSubtask}
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

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistically update UI
    setTasks((prev) => prev.map((task) =>
      task.id === taskId ? { ...task, completed: newCompleted } : task
    ));

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          taskId,
          updates: { completed: newCompleted }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update
      setTasks((prev) => prev.map((task) =>
        task.id === taskId ? { ...task, completed: !newCompleted } : task
      ));
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const newCompleted = !subtask.completed;
    const updatedSubtasks = task.subtasks.map(sub =>
      sub.id === subtaskId ? { ...sub, completed: newCompleted } : sub
    );

    // Optimistically update UI
    setTasks((prev) => prev.map((task) =>
      task.id === taskId ? { ...task, subtasks: updatedSubtasks } : task
    ));

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          taskId,
          updates: { subtasks: updatedSubtasks }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subtask');
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      // Revert optimistic update
      setTasks((prev) => prev.map((task) =>
        task.id === taskId
          ? {
            ...task,
            subtasks: task.subtasks.map((sub) =>
              sub.id === subtaskId ? { ...sub, completed: !newCompleted } : sub
            )
          }
          : task
      ));
      toast({
        title: "Error",
        description: "Failed to update subtask. Please try again.",
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

  const handleClearTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?eventId=${event._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks([]);
        setHasGenerated(false);
        toast({
          title: "Tasks Cleared",
          description: "All tasks have been removed.",
        });
      } else {
        throw new Error('Failed to clear tasks');
      }
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to clear tasks. Please try again.",
        variant: "destructive"
      });
    }
  };

  const columns = [
    { id: 'planning', title: 'Planning', icon: '📋' },
    { id: 'developing', title: 'In Progress', icon: '🔧' },
    { id: 'reviewing', title: 'Review', icon: '👁️' },
    { id: 'finished', title: 'Completed', icon: '✅' },
  ];

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const totalSubtasks = tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
    const completedSubtasks = tasks.reduce((sum, task) =>
      sum + task.subtasks.filter(sub => sub.completed).length, 0
    );
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress, totalSubtasks, completedSubtasks };
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

      {/* Progress Stats */}
      {tasks.length > 0 && (
        <Card className="mb-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-3xl font-bold text-blue-700 mb-1">{stats.total}</div>
                <div className="text-sm font-medium text-blue-600">Total Tasks</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-700 mb-1">{stats.completed}</div>
                <div className="text-sm font-medium text-emerald-600">Completed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-100">
                <div className="text-3xl font-bold text-purple-700 mb-1">{stats.progress}%</div>
                <div className="text-sm font-medium text-purple-600">Progress</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                <div className="text-2xl font-bold text-orange-700 mb-1">{stats.completedSubtasks}/{stats.totalSubtasks}</div>
                <div className="text-sm font-medium text-orange-600">Subtasks</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-gray-900">{stats.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            {hasGenerated && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleClearTasks} size="sm" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All Tasks
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateTasks(true)}
                  size="sm"
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate Tasks
                </Button>
              </div>
            )}
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
                  onToggleTask={handleToggleTask}
                  onToggleSubtask={handleToggleSubtask}
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
          <Button onClick={() => handleGenerateTasks(true)} disabled={isGenerating} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventPlanner;