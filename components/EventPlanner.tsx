'use client';
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Clock, AlertCircle, Calendar, MapPin, Users } from 'lucide-react';
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
      className={`p-2 ml-4 mb-1 bg-gray-50 border rounded cursor-move hover:bg-gray-100 transition-colors ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={subtask.completed}
          onChange={() => onToggleSubtask(taskId, subtask.id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
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
      className={`p-4 mb-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move ${isDragging ? 'opacity-50' : ''} ${task.completed ? 'bg-green-50 border-green-200' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleTask(task.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <h4 className={`font-medium text-gray-900 flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
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
      case 'planning': return 'border-t-blue-500 bg-blue-50/50';
      case 'developing': return 'border-t-yellow-500 bg-yellow-50/50';
      case 'reviewing': return 'border-t-orange-500 bg-orange-50/50';
      case 'finished': return 'border-t-green-500 bg-green-50/50';
      default: return 'border-t-gray-500 bg-gray-50/50';
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;

  return (
    <div ref={drop as any} className={`w-1/4 p-4 border-2 border-dashed border-transparent rounded-lg transition-colors ${isOver ? 'border-blue-300 bg-blue-50' : getColumnColor()}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border-t-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
            {tasks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {completedTasks}/{tasks.length}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
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
            <div className="text-center py-8 text-gray-400">
              <div className="text-sm">No tasks yet</div>
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
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const { toast } = useToast();

  const storageKey = `eventPlanner_${event._id}`;

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(storageKey);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
        setHasGenerated(parsedTasks.length > 0);
      } catch (error) {
        console.error('Error loading saved tasks:', error);
      }
    }
  }, [storageKey]);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [tasks, storageKey]);

  // Auto-generate tasks on initial load if no tasks exist
  useEffect(() => {
    if (isInitialLoad && tasks.length === 0 && !hasGenerated && !isGenerating) {
      setIsInitialLoad(false);
      handleGenerateTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoad, tasks.length, hasGenerated, isGenerating]);

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    try {
      const categoryName = typeof event.category === 'string' ? event.category : event.category.name;

      const response = await fetch('/api/generate-tasks', {
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
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const { tasks: generatedTasks } = await response.json();

      // Convert to our Task format with completion tracking
      const newTasks: Task[] = generatedTasks.map((suggestion: any) => ({
        id: suggestion.id,
        content: suggestion.content,
        column: suggestion.column,
        subtasks: suggestion.subtasks.map((sub: any) => ({
          ...sub,
          completed: false
        })),
        priority: suggestion.priority,
        estimatedDuration: suggestion.estimatedDuration,
        completed: false
      }));

      setTasks(newTasks);
      setHasGenerated(true);

      toast({
        title: "Tasks Generated Successfully! ✨",
        description: `Generated ${newTasks.length} tasks for ${isSubEvent ? 'sub-event' : 'event'}: "${event.title}".`,
      });
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

  const handleDropTask = (id: string, newColumn: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: newColumn } : t)));
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) => prev.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) => prev.map((task) =>
      task.id === taskId
        ? {
          ...task,
          subtasks: task.subtasks.map((sub) =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          )
        }
        : task
    ));
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

  const handleClearTasks = () => {
    setTasks([]);
    setHasGenerated(false);
    localStorage.removeItem(storageKey);
    toast({
      title: "Tasks Cleared",
      description: "All tasks have been removed.",
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

  return (
    <div className="space-y-6">
      {/* Event Details Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5" />
            {event.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-4 text-sm">
            <Badge variant="secondary">{categoryName}</Badge>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.isOnline ? 'Online' : event.location}</span>
              </div>
            )}
            {event.totalCapacity && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{event.totalCapacity} attendees</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Auto-generating tasks indicator */}
      {isGenerating && (
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Generating AI-Powered Tasks</h3>
                <p className="text-blue-700">Creating a personalized task list for your {categoryName.toLowerCase()} event...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Stats */}
      {tasks.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.progress}%</div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.completedSubtasks}/{stats.totalSubtasks}</div>
                <div className="text-sm text-gray-600">Subtasks Done</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            {hasGenerated && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleClearTasks} size="sm">
                  Clear All Tasks
                </Button>
                <Button variant="outline" onClick={handleGenerateTasks} size="sm" disabled={isGenerating}>
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
          <div className="flex space-x-4 overflow-x-auto pb-4">
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
        </DndProvider>
      )}

      {/* Empty State */}
      {tasks.length === 0 && hasGenerated && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks generated</h3>
          <p className="text-gray-600 mb-4">Something went wrong with task generation. Please try again.</p>
          <Button onClick={handleGenerateTasks} disabled={isGenerating}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventPlanner;