'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Save,
  Eye,
  Plus,
  Trash2,
  Edit2,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { DEFAULT_FEEDBACK_QUESTIONS, getDefaultQuestionsForEvent } from '@/lib/constants/feedback';
import { ICustomQuestion } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FeedbackTemplate {
  _id: string;
  event: string;
  customQuestions: ICustomQuestion[];
  feedbackHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackFormManagerProps {
  eventId: string;
  eventTitle: string;
  isOnline: boolean;
}

export default function FeedbackFormManager({
  eventId,
  eventTitle,
  isOnline
}: FeedbackFormManagerProps) {
  const [template, setTemplate] = useState<FeedbackTemplate | null>(null);
  const [customQuestions, setCustomQuestions] = useState<ICustomQuestion[]>([]);
  const [feedbackHours, setFeedbackHours] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ICustomQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<ICustomQuestion>>({
    question: '',
    type: 'text',
    required: false,
    options: []
  });
  const { toast } = useToast();

  const defaultQuestions = getDefaultQuestionsForEvent(isOnline);

  useEffect(() => {
    fetchTemplate();
  }, [eventId]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/template/${eventId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
        setCustomQuestions(data.template.customQuestions || []);
        setFeedbackHours(data.template.feedbackHours || 2);
      } else if (response.status === 404) {
        // No template exists yet, use defaults
        setTemplate(null);
        setCustomQuestions([]);
        setFeedbackHours(2);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/feedback/template/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customQuestions,
          feedbackHours,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save feedback template');
      }

      const data = await response.json();
      setTemplate(data.template);
      
      toast({
        title: "Success",
        description: "Feedback form saved successfully",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question || !newQuestion.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const question: ICustomQuestion = {
      id: `custom_${Date.now()}`,
      question: newQuestion.question!,
      type: newQuestion.type as any,
      required: newQuestion.required || false,
      options: newQuestion.options || []
    };

    setCustomQuestions([...customQuestions, question]);
    setNewQuestion({
      question: '',
      type: 'text',
      required: false,
      options: []
    });

    toast({
      title: "Success",
      description: "Custom question added",
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
    toast({
      title: "Success",
      description: "Question deleted",
    });
  };

  const handleEditQuestion = (question: ICustomQuestion) => {
    setEditingQuestion(question);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;

    setCustomQuestions(customQuestions.map(q => 
      q.id === editingQuestion.id ? editingQuestion : q
    ));
    setEditingQuestion(null);

    toast({
      title: "Success",
      description: "Question updated",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Form Configuration</h2>
          <p className="text-gray-600 mt-1">Customize your event feedback form</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Feedback Form Preview</DialogTitle>
                <DialogDescription>
                  This is how your feedback form will appear to attendees
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Default Questions Preview */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Default Questions</h3>
                  {defaultQuestions.map((q, index) => (
                    <div key={q.id} className="mb-4 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{index + 1}. {q.question}</p>
                          <p className="text-sm text-gray-500 mt-1">{q.description}</p>
                        </div>
                        {q.required && (
                          <Badge variant="destructive" className="ml-2">Required</Badge>
                        )}
                      </div>
                      <div className="mt-2">
                        {q.type === 'rating' && (
                          <div className="flex gap-1">
                            {[...Array(q.max)].map((_, i) => (
                              <Star key={i} className="w-6 h-6 text-gray-300" />
                            ))}
                          </div>
                        )}
                        {q.type === 'nps' && (
                          <div className="flex gap-1">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className="w-8 h-8 border rounded flex items-center justify-center text-sm">
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'text' && (
                          <Textarea placeholder={q.placeholder} disabled className="mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Questions Preview */}
                {customQuestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Custom Questions</h3>
                    {customQuestions.map((q, index) => (
                      <div key={q.id} className="mb-4 p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{defaultQuestions.length + index + 1}. {q.question}</p>
                          </div>
                          {q.required && (
                            <Badge variant="destructive" className="ml-2">Required</Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          {q.type === 'rating' && (
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-6 h-6 text-gray-300" />
                              ))}
                            </div>
                          )}
                          {q.type === 'text' && (
                            <Textarea disabled className="mt-2" />
                          )}
                          {q.type === 'multipleChoice' && q.options && (
                            <div className="space-y-2 mt-2">
                              {q.options.map((option, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <input type="radio" disabled />
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'yesNo' && (
                            <div className="flex gap-4 mt-2">
                              <Button variant="outline" disabled>Yes</Button>
                              <Button variant="outline" disabled>No</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Feedback Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Label>Send feedback email after event ends</Label>
            <Select
              value={feedbackHours.toString()}
              onValueChange={(value) => setFeedbackHours(parseInt(value))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">1 day</SelectItem>
                <SelectItem value="48">2 days</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Default Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Default Questions</CardTitle>
          <CardDescription>
            These questions are automatically included in every feedback form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {defaultQuestions.map((q, index) => (
              <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{index + 1}. {q.question}</p>
                  <p className="text-xs text-gray-500 mt-1">{q.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{q.type}</Badge>
                  {q.required && <Badge variant="destructive">Required</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Questions</CardTitle>
          <CardDescription>
            Add your own questions to gather specific feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Custom Questions */}
          {customQuestions.length > 0 && (
            <div className="space-y-3 mb-6">
              {customQuestions.map((q, index) => (
                <div key={q.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex-1">
                    <p className="font-medium">{defaultQuestions.length + index + 1}. {q.question}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{q.type}</Badge>
                      {q.required && <Badge variant="destructive">Required</Badge>}
                      {q.options && q.options.length > 0 && (
                        <Badge variant="secondary">{q.options.length} options</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(q)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Question Form */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Add New Question</h4>
            <div className="space-y-4">
              <div>
                <Label>Question Text *</Label>
                <Input
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Enter your question"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Question Type *</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as any })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="rating">Rating (1-5 stars)</SelectItem>
                      <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                      <SelectItem value="yesNo">Yes/No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newQuestion.required}
                      onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
                    />
                    <Label>Required</Label>
                  </div>
                </div>
              </div>

              {newQuestion.type === 'multipleChoice' && (
                <div>
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={newQuestion.options?.join(', ')}
                    onChange={(e) => setNewQuestion({ 
                      ...newQuestion, 
                      options: e.target.value.split(',').map(o => o.trim()).filter(o => o) 
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                    className="mt-2"
                  />
                </div>
              )}

              <Button onClick={handleAddQuestion} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Question Text</Label>
                <Input
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Question Type</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value) => setEditingQuestion({ ...editingQuestion, type: value as any })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="rating">Rating (1-5 stars)</SelectItem>
                    <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                    <SelectItem value="yesNo">Yes/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingQuestion.required}
                  onCheckedChange={(checked) => setEditingQuestion({ ...editingQuestion, required: checked })}
                />
                <Label>Required</Label>
              </div>

              {editingQuestion.type === 'multipleChoice' && (
                <div>
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={editingQuestion.options?.join(', ')}
                    onChange={(e) => setEditingQuestion({ 
                      ...editingQuestion, 
                      options: e.target.value.split(',').map(o => o.trim()).filter(o => o) 
                    })}
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateQuestion}>
                  Update Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

