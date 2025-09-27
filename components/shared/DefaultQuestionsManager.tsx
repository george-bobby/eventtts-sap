'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Edit2, 
  Check, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { DEFAULT_FEEDBACK_QUESTIONS, DefaultQuestion, getDefaultQuestionsForEvent } from '@/lib/constants/feedback';

interface DefaultQuestionsManagerProps {
  isOnline: boolean;
  onQuestionsChange?: (questions: DefaultQuestion[]) => void;
  initialQuestions?: DefaultQuestion[];
}

export default function DefaultQuestionsManager({ 
  isOnline, 
  onQuestionsChange,
  initialQuestions 
}: DefaultQuestionsManagerProps) {
  const [questions, setQuestions] = useState<DefaultQuestion[]>(
    initialQuestions || getDefaultQuestionsForEvent(isOnline)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'rating':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'nps':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
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
      case 'nps':
        return 'NPS Score';
      case 'text':
        return 'Text Response';
      default:
        return 'Unknown';
    }
  };

  const handleEditStart = (question: DefaultQuestion) => {
    setEditingId(question.id);
    setEditText(question.question);
  };

  const handleEditSave = (questionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, question: editText } : q
    );
    setQuestions(updatedQuestions);
    setEditingId(null);
    setEditText('');
    onQuestionsChange?.(updatedQuestions);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleRequiredToggle = (questionId: string, required: boolean) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, required } : q
    );
    setQuestions(updatedQuestions);
    onQuestionsChange?.(updatedQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Default Feedback Questions</h3>
          <p className="text-sm text-gray-600">
            These questions will be automatically included in your feedback form. You can customize the text and make them optional.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Preview Form'}
        </Button>
      </div>

      <div className="grid gap-4">
        {questions.map((question) => (
          <Card key={question.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getQuestionIcon(question.type)}
                  <div className="flex-1 space-y-2">
                    {editingId === question.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px]"
                          placeholder="Enter question text..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(question.id)}
                            className="flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{question.question}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStart(question)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getQuestionTypeLabel(question.type)}
                          </Badge>
                          {question.type === 'rating' && (
                            <Badge variant="outline" className="text-xs">
                              {question.min}-{question.max} stars
                            </Badge>
                          )}
                          {question.type === 'nps' && (
                            <Badge variant="outline" className="text-xs">
                              1-10 scale
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{question.description}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor={`required-${question.id}`} className="text-sm">
                    Required
                  </Label>
                  <Switch
                    id={`required-${question.id}`}
                    checked={question.required}
                    onCheckedChange={(checked) => handleRequiredToggle(question.id, checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showPreview && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Feedback Form Preview</CardTitle>
            <CardDescription className="text-blue-700">
              This is how your default questions will appear to attendees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  {getQuestionIcon(question.type)}
                  <span className="font-medium">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
                {question.type === 'rating' && (
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gray-300" />
                    ))}
                  </div>
                )}
                {question.type === 'nps' && (
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-8 h-8 border rounded text-center text-sm flex items-center justify-center">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                )}
                {question.type === 'text' && (
                  <Textarea 
                    placeholder={question.placeholder || 'Your response...'} 
                    disabled 
                    className="bg-gray-50"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
