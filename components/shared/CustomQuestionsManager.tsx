'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Star, 
  MessageSquare, 
  List, 
  ToggleLeft,
  GripVertical
} from 'lucide-react';
import { ICustomQuestion } from '@/types';

interface CustomQuestionsManagerProps {
  questions: ICustomQuestion[];
  onQuestionsChange: (questions: ICustomQuestion[]) => void;
}

export default function CustomQuestionsManager({ 
  questions, 
  onQuestionsChange 
}: CustomQuestionsManagerProps) {
  const [newQuestion, setNewQuestion] = useState<Partial<ICustomQuestion>>({
    question: '',
    type: 'text',
    required: false,
    options: []
  });

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'rating':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'multipleChoice':
        return <List className="w-4 h-4 text-purple-500" />;
      case 'yesNo':
        return <ToggleLeft className="w-4 h-4 text-blue-500" />;
      case 'text':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'rating':
        return 'Star Rating';
      case 'multipleChoice':
        return 'Multiple Choice';
      case 'yesNo':
        return 'Yes/No';
      case 'text':
        return 'Text Response';
      default:
        return 'Unknown';
    }
  };

  const addQuestion = () => {
    if (!newQuestion.question?.trim()) return;

    const question: ICustomQuestion = {
      id: `custom_${Date.now()}`,
      question: newQuestion.question,
      type: newQuestion.type as 'rating' | 'text' | 'multipleChoice' | 'yesNo',
      required: newQuestion.required || false,
      options: newQuestion.type === 'multipleChoice' ? newQuestion.options : undefined
    };

    onQuestionsChange([...questions, question]);
    setNewQuestion({
      question: '',
      type: 'text',
      required: false,
      options: []
    });
  };

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<ICustomQuestion>) => {
    onQuestionsChange(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Custom Questions</h3>
        <p className="text-sm text-gray-600">
          Add specific questions tailored to your event. These will appear after the default questions.
        </p>
      </div>

      {/* Add New Question */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="text-base">Add Custom Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Response</SelectItem>
                  <SelectItem value="rating">Star Rating (1-5)</SelectItem>
                  <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                  <SelectItem value="yesNo">Yes/No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={newQuestion.required}
                onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
              />
              <Label htmlFor="required">Required</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea
              placeholder="Enter your question..."
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          {newQuestion.type === 'multipleChoice' && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {(newQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(newQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = (newQuestion.options || []).filter((_, i) => i !== index);
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(newQuestion.options || []), `Option ${(newQuestion.options || []).length + 1}`];
                    setNewQuestion({ ...newQuestion, options: newOptions });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <Button onClick={addQuestion} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Existing Questions */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Your Custom Questions</h4>
          {questions.map((question, index) => (
            <Card key={question.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      {getQuestionIcon(question.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{question.question}</span>
                        {question.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                        <span className="text-xs text-gray-500">Question #{index + 1}</span>
                      </div>
                      
                      {question.type === 'multipleChoice' && question.options && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">Options:</p>
                          <div className="flex flex-wrap gap-1">
                            {question.options.map((option, optIndex) => (
                              <Badge key={optIndex} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
