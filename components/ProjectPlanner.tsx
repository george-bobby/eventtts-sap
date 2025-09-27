'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, Target, CheckCircle2, Plus, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  team: string[];
  tasks: Task[];
}

const ProjectPlanner: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDescription,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        team: [],
        tasks: []
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
      setNewProjectDescription('');
    }
  };

  const addTask = (projectId: string) => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        description: '',
        assignee: '',
        dueDate: '',
        completed: false
      };
      
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, tasks: [...project.tasks, newTask] }
          : project
      ));
      setNewTaskTitle('');
    }
  };

  const toggleTaskComplete = (projectId: string, taskId: string) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? {
            ...project, 
            tasks: project.tasks.map(task => 
              task.id === taskId 
                ? { ...task, completed: !task.completed }
                : task
            )
          }
        : project
    ));
  };

  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
    if (selectedProject === projectId) {
      setSelectedProject(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Planner</h1>
          <p className="text-gray-600">Organize your projects and track progress efficiently</p>
        </div>

        {/* Add New Project */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Textarea
                placeholder="Project description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
            <Button onClick={addProject} className="mt-4">
              Create Project
            </Button>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProject(project.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {project.startDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {project.tasks.filter(t => t.completed).length}/{project.tasks.length}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: project.tasks.length > 0 
                          ? `${(project.tasks.filter(t => t.completed).length / project.tasks.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>

                  {/* Task Management */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new task"
                        value={selectedProject === project.id ? newTaskTitle : ''}
                        onChange={(e) => {
                          setSelectedProject(project.id);
                          setNewTaskTitle(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTask(project.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => addTask(project.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tasks List */}
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {project.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            task.completed ? 'bg-green-50 text-green-700' : 'bg-gray-50'
                          }`}
                        >
                          <button
                            onClick={() => toggleTaskComplete(project.id, task.id)}
                            className={`h-4 w-4 rounded border-2 ${
                              task.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300'
                            }`}
                          >
                            {task.completed && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </button>
                          <span className={task.completed ? 'line-through' : ''}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600">Create your first project to get started with planning and tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPlanner;