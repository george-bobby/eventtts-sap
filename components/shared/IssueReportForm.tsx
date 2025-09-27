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
    isModal?: boolean;
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

export default function IssueReportForm({ event, currentUserId, onClose, isModal = false }: IssueReportFormProps) {
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
            <Card className={isModal ? "w-full" : "max-w-2xl mx-auto"}>
                <CardContent className="p-6 sm:p-8 text-center">
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-2">Issue Reported Successfully!</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">{submitStatus.message}</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {!isModal && (
                            <Button onClick={() => router.back()} variant="outline" className="w-full sm:w-auto">
                                Back to Events
                            </Button>
                        )}
                        {onClose && (
                            <Button onClick={onClose} className="w-full sm:w-auto">
                                Close
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={isModal ? "w-full border-0 shadow-none" : "max-w-2xl mx-auto"}>
            <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg sm:text-xl font-semibold">Report an Issue</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-1">
                            Report a problem with "{event.title}"
                        </CardDescription>
                    </div>
                </div>

                {/* Event Info Badge */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border mt-4">
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div><strong>Event:</strong> <span className="break-words">{event.title}</span></div>
                        <div><strong>Organizer:</strong> {(event.organizer as any)?.firstName} {(event.organizer as any)?.lastName}</div>
                        <div><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Issue Category */}
                    <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-medium">Issue Category *</Label>
                        <RadioGroup
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}
                            className="space-y-2"
                        >
                            {Object.entries(issueCategories).map(([key, category]) => (
                                <div key={key} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                    <RadioGroupItem value={key} id={key} className="flex-shrink-0" />
                                    <label htmlFor={key} className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                        <span className="text-base sm:text-lg flex-shrink-0">{category.icon}</span>
                                        <span className="font-medium text-sm sm:text-base">{category.label}</span>
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Subcategory */}
                    {formData.category && (
                        <div className="space-y-2 sm:space-y-3">
                            <Label className="text-sm sm:text-base font-medium">Specific Issue Type</Label>
                            <Select value={formData.subcategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select specific issue type (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {issueCategories[formData.category as keyof typeof issueCategories]?.subcategories.map((sub) => (
                                        <SelectItem key={sub} value={sub} className="text-sm">{sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Priority/Severity */}
                    <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-medium">Priority Level *</Label>
                        <RadioGroup
                            value={formData.severity}
                            onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, severity: value }))}
                            className="space-y-2"
                        >
                            {severityOptions.map((option) => (
                                <div key={option.value} className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors ${formData.severity === option.value ? option.color : 'hover:bg-gray-50'}`}>
                                    <RadioGroupItem value={option.value} id={option.value} className="flex-shrink-0" />
                                    <label htmlFor={option.value} className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1 min-w-0">
                                        <span className="text-base sm:text-lg flex-shrink-0">{option.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm sm:text-base">{option.label}</div>
                                            <div className="text-xs sm:text-sm text-gray-600 break-words">{option.description}</div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Issue Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm sm:text-base font-medium">Issue Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Brief description of the issue"
                            className="w-full text-sm sm:text-base"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm sm:text-base font-medium">Detailed Description *</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Please provide as much detail as possible about the issue..."
                            className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
                        />
                    </div>

                    {/* Advanced Options Toggle */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full text-sm sm:text-base"
                        size={isModal ? "sm" : "default"}
                    >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    </Button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
                            <h4 className="font-medium text-sm sm:text-base">Advanced Options</h4>

                            {/* File Attachments */}
                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base font-medium">Attachments (Screenshots, Photos, etc.)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                                        <p className="mt-2 text-xs sm:text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                                                Upload files
                                            </label>
                                            <span className="hidden sm:inline">{" or drag and drop"}</span>
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
                                        <Label className="text-xs sm:text-sm font-medium">Uploaded Files:</Label>
                                        <div className="space-y-1 sm:space-y-2">
                                            {formData.attachments.map((attachment, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <FileIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm truncate">File {index + 1}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAttachment(index)}
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                    >
                                                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {submitStatus?.type === 'error' && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-700 text-sm">
                                {submitStatus.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 text-sm sm:text-base order-2 sm:order-1"
                            onClick={() => onClose ? onClose() : router.back()}
                            disabled={isSubmitting}
                            size={isModal ? "sm" : "default"}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-sm sm:text-base order-1 sm:order-2"
                            disabled={isSubmitting}
                            size={isModal ? "sm" : "default"}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                                    <span className="hidden sm:inline">Submitting...</span>
                                    <span className="sm:hidden">Submit...</span>
                                </>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Submit Issue Report</span>
                                    <span className="sm:hidden">Submit Report</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}