'use client';
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { categories } from '@/constants/categories';
import { useToast } from '@/hooks/use-toast';

// Define types
interface Subtask {
  id: string;
  content: string;
}

interface Task {
  id: string;
  content: string;
  column: string;
  subtasks: Subtask[];
  priority?: 'high' | 'medium' | 'low';
  estimatedDuration?: string;
}

// Draggable Subtask component
const SubtaskItem: React.FC<{
  subtask: Subtask;
  taskId: string;
  index: number;
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
}> = ({ subtask, taskId, index, onMoveSubtask }) => {
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
      <span className="text-sm">{subtask.content}</span>
    </div>
  );
};

// Droppable area for subtasks inside a task
const SubtaskList: React.FC<{
  taskId: string;
  subtasks: Subtask[];
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
}> = ({ taskId, subtasks, onMoveSubtask }) => {
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

// Draggable and Droppable Task Card (for main tasks)
const TaskCard: React.FC<{
  task: Task;
  onDropTask: (id: string, newColumn: string) => void;
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
}> = ({ task, onDropTask, onMoveSubtask }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, column: task.column },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-4 mb-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{task.content}</h4>
        <PriorityBadge priority={task.priority} />
      </div>
      
      {task.estimatedDuration && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Clock className="h-3 w-3" />
          <span>{task.estimatedDuration}</span>
        </div>
      )}

      <SubtaskList taskId={task.id} subtasks={task.subtasks} onMoveSubtask={onMoveSubtask} />
    </div>
  );
};

// Droppable Column component
const Column: React.FC<{
  title: string;
  columnId: string;
  tasks: Task[];
  onDropTask: (id: string, newColumn: string) => void;
  onMoveSubtask: (subtaskId: string, sourceTaskId: string, targetTaskId: string, targetIndex: number) => void;
}> = ({ title, columnId, tasks, onDropTask, onMoveSubtask }) => {
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

  return (
    <div ref={drop as any} className={`w-1/4 p-4 border-2 border-dashed border-transparent rounded-lg transition-colors ${isOver ? 'border-blue-300 bg-blue-50' : getColumnColor()}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border-t-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDropTask={onDropTask} onMoveSubtask={onMoveSubtask} />
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

// Main ProjectPlanner component
const ProjectPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();

  // Load initial tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('eventPlannerTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading saved tasks:', error);
      }
    }

    // Check for recently created event
    const lastCreatedEvent = localStorage.getItem('lastCreatedEvent');
    if (lastCreatedEvent) {
      try {
        const eventData = JSON.parse(lastCreatedEvent);
        setSelectedEventType(eventData.category || '');
        setEventTitle(eventData.title || '');
        setEventDescription(eventData.description || '');
        
        // Show a toast suggesting to generate tasks
        toast({
          title: "Welcome to Event Planning! 🎯",
          description: `Ready to plan tasks for "${eventData.title}"?`,
          duration: 5000
        });
        
        // Clear the stored event data so it doesn't persist
        localStorage.removeItem('lastCreatedEvent');
      } catch (error) {
        console.error('Error loading last created event:', error);
      }
    }
  }, [toast]);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('eventPlannerTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleGenerateTasks = async () => {
    if (!selectedEventType) {
      toast({
        title: "Please select an event type",
        description: "Choose an event type to generate relevant tasks.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: selectedEventType,
          eventTitle,
          eventDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const { tasks: generatedTasks } = await response.json();
      
      // Convert TaskSuggestion[] to Task[]
      const newTasks: Task[] = generatedTasks.map((suggestion: any) => ({
        id: suggestion.id,
        content: suggestion.content,
        column: suggestion.column,
        subtasks: suggestion.subtasks,
        priority: suggestion.priority,
        estimatedDuration: suggestion.estimatedDuration
      }));

      setTasks(newTasks);
      
      toast({
        title: "Tasks Generated Successfully! ✨",
        description: `Generated ${newTasks.length} tasks for your ${selectedEventType} event.`,
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
    localStorage.removeItem('eventPlannerTasks');
    toast({
      title: "Tasks Cleared",
      description: "All tasks have been removed.",
    });
  };

  const columns = [
    { id: 'planning', title: 'Planning', icon: '📋' },
    { id: 'developing', title: 'Developing', icon: '🔧' },
    { id: 'reviewing', title: 'Reviewing', icon: '👁️' },
    { id: 'finished', title: 'Finished', icon: '✅' },
  ];

  const getTaskStats = () => {
    const total = tasks.length;
    const finished = tasks.filter(task => task.column === 'finished').length;
    const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
    return { total, finished, progress };
  };

  const stats = getTaskStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Event Planning Board</h1>
          <p className="text-gray-600">AI-powered task generation for your events</p>
        </div>

        {/* Task Generation Section */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5" />
              Generate Event Tasks with AI
            </CardTitle>
            <CardDescription>
              Select your event type and let AI generate a comprehensive task list for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.title} value={category.title.toLowerCase().trim()}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Event title (optional)"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              
              <Input
                placeholder="Brief description (optional)"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateTasks} 
                disabled={isGenerating || !selectedEventType}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Tasks...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Tasks
                  </>
                )}
              </Button>
              
              {tasks.length > 0 && (
                <Button variant="outline" onClick={handleClearTasks}>
                  Clear All Tasks
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        {tasks.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.finished}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.progress}%</div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Board */}
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
              />
            ))}
          </div>
        </DndProvider>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">Select an event type above and generate AI-powered tasks to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPlanner;
