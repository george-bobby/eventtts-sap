'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import IssueReportForm from './IssueReportForm';
import { EventWithSubEvents } from '@/lib/actions/event.action';

interface RaiseIssueButtonProps {
    event: EventWithSubEvents;
    currentUserId: string;
    variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
    size?: 'sm' | 'default' | 'lg' | 'icon';
    className?: string;
    showText?: boolean;
}

export default function RaiseIssueButton({
    event,
    currentUserId,
    variant = 'outline',
    size = 'sm',
    className = '',
    showText = true
}: RaiseIssueButtonProps) {
    const [open, setOpen] = useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className || `text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300`}
                >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {showText ? 'Report Issue' : ''}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] p-0 gap-0 mx-auto">
                <DialogHeader className="sr-only">
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogDescription>
                        Report a problem with {event.title}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[85vh] p-4 sm:p-6">
                    <IssueReportForm
                        event={event}
                        currentUserId={currentUserId}
                        onClose={handleClose}
                        isModal={true}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}