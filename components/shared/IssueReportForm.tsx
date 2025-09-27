'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileIcon, Loader2, CheckCircle, XCircle, Upload } from 'lucide-react';
import { createIssue } from '@/lib/actions/issue.action';
import { EventWithSubEvents } from '@/lib/actions/event.action';

interface IssueReportFormProps {
    event: EventWithSubEvents;
    currentUserId: string;
    onClose?: () => void;
}

const issueCategories = {
    'event-info': {
        label: 'Event Information Issue',
        icon: '📅',
        subcategories: [
            'Wrong date/time',
            'Wrong location/venue',
            'Speaker/performer details incorrect',
            'Event description inaccurate',
            'Missing important information'
        ]
    },
    'tickets-registration': {
        label: 'Tickets & Registration',
        icon: '🎫',
        subcategories: [
            'Unable to purchase ticket',
            'Ticket not received',
            'Ticket not scanning at entry',
            'Refund/transfer issue',
            'Registration system error'
        ]
    },
    'event-experience': {
        label: 'Event Experience',
        icon: '🎭',
        subcategories: [
            'Accessibility problem',
            'Live stream not working',
            'Facilities issue (parking, seating, food)',
            'Audio/video technical issues',
            'Poor event organization'
        ]
    },
    'payments': {
        label: 'Payments',
        icon: '💳',
        subcategories: [
            'Charged incorrectly',
            'Invoice/tax issue',
            'Payment processing error',
            'Refund not processed'
        ]
    },
    'other': {
        label: 'Other',
        icon: '📝',
        subcategories: [
            'General complaint or feedback',
            'Safety concern',
            'Harassment report',
            'Technical issue with platform'
        ]
    }
};

const severityOptions = [
    { 
        value: 'low', 
        label: 'Low Priority', 
        description: 'Not urgent, just FYI',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '🟢'
    },
    { 
        value: 'medium', 
        label: 'Medium Priority', 
        description: 'Affects me, but event can continue',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '🟡'
    },
    { 
        value: 'high', 
        label: 'High Priority', 
        description: 'Urgent, blocking participation',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: '🔴'
    }
];

export default function IssueReportForm({ event, currentUserId, onClose }: IssueReportFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        category: '',
        subcategory: '',
        severity: 'medium' as 'low' | 'medium' | 'high',
        title: '',
        description: '',
        attachments: [] as string[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.category || !formData.title || !formData.description) {
            setSubmitStatus({ 
                type: 'error', 
                message: 'Please fill in all required fields.' 
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const result = await createIssue({
                eventId: event._id?.toString() || '',
                reportedBy: currentUserId,
                category: formData.category,
                subcategory: formData.subcategory || undefined,
                severity: formData.severity,
                title: formData.title,
                description: formData.description,
                attachments: formData.attachments
            });

            if (result.success) {
                setSubmitStatus({ 
                    type: 'success', 
                    message: `Issue reported successfully! Issue ID: #${result.issueId?.slice(-8).toUpperCase()}. The event organizer has been notified via email.` 
                });
                
                // Reset form
                setFormData({
                    category: '',
                    subcategory: '',
                    severity: 'medium',
                    title: '',
                    description: '',
                    attachments: []
                });

                // Close form after 3 seconds
                setTimeout(() => {
                    if (onClose) onClose();
                    else router.back();
                }, 3000);
            } else {
                setSubmitStatus({ 
                    type: 'error', 
                    message: result.error || 'Failed to submit issue. Please try again.' 
                });
            }
        } catch (error) {
            setSubmitStatus({ 
                type: 'error', 
                message: 'An unexpected error occurred. Please try again.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        // Here you would typically upload to your file storage service
        // For now, we'll just create placeholder URLs
        const newAttachments = Array.from(files).map(file => 
            URL.createObjectURL(file) // This is just a placeholder
        );
        
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...newAttachments]
        }));
    };

    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    if (submitStatus?.type === 'success') {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Issue Reported Successfully!</h2>
                    <p className="text-gray-600 mb-4">{submitStatus.message}</p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={() => router.back()} variant="outline">
                            Back to Events
                        </Button>
                        {onClose && (
                            <Button onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <div>
                        <CardTitle className="text-xl">Report an Issue</CardTitle>
                        <CardDescription>
                            Report a problem with "{event.title}"
                        </CardDescription>
                    </div>
                </div>
                
                {/* Event Info Badge */}
                <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="text-sm text-gray-600">
                        <strong>Event:</strong> {event.title} <br />
                        <strong>Organizer:</strong> {(event.organizer as any)?.firstName} {(event.organizer as any)?.lastName} <br />
                        <strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Issue Category */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Issue Category *</Label>
                        <RadioGroup 
                            value={formData.category} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}
                        >
                            {Object.entries(issueCategories).map(([key, category]) => (
                                <div key={key} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                                    <RadioGroupItem value={key} id={key} />
                                    <label htmlFor={key} className="flex items-center gap-2 cursor-pointer flex-1">
                                        <span className="text-lg">{category.icon}</span>
                                        <span className="font-medium">{category.label}</span>
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Subcategory */}
                    {formData.category && (
                        <div className="space-y-3">
                            <Label className="text-base font-medium">Specific Issue Type</Label>
                            <Select value={formData.subcategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select specific issue type (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {issueCategories[formData.category as keyof typeof issueCategories]?.subcategories.map((sub) => (
                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Priority/Severity */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Priority Level *</Label>
                        <RadioGroup 
                            value={formData.severity} 
                            onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, severity: value }))}
                        >
                            {severityOptions.map((option) => (
                                <div key={option.value} className={`flex items-center space-x-3 p-3 rounded-lg border ${formData.severity === option.value ? option.color : 'hover:bg-gray-50'}`}>
                                    <RadioGroupItem value={option.value} id={option.value} />
                                    <label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1">
                                        <span className="text-lg">{option.icon}</span>
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-sm text-gray-600">{option.description}</div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Issue Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-base font-medium">Issue Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Brief description of the issue"
                            className="w-full"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-medium">Detailed Description *</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Please provide as much detail as possible about the issue..."
                            className="min-h-[120px]"
                        />
                    </div>

                    {/* Advanced Options Toggle */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full"
                    >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    </Button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium">Advanced Options</h4>
                            
                            {/* File Attachments */}
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Attachments (Screenshots, Photos, etc.)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                                                Upload files
                                            </label>
                                            {" or drag and drop"}
                                        </p>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                        />
                                    </div>
                                </div>
                                
                                {/* Display uploaded files */}
                                {formData.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Uploaded Files:</Label>
                                        {formData.attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <FileIcon className="w-4 h-4" />
                                                    <span className="text-sm">File {index + 1}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeAttachment(index)}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {submitStatus?.type === 'error' && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-700">
                                {submitStatus.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => onClose ? onClose() : router.back()}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Issue Report'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}