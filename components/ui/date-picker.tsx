'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  minDate,
  maxDate,
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const CustomInput = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }
  >(({ value, onClick, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "w-full pl-3 text-left font-normal justify-start",
        !selected && "text-muted-foreground",
        className
      )}
      onClick={onClick}
      type="button"
      {...props}
    >
      {value || placeholder}
      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
    </Button>
  ));

  CustomInput.displayName = 'CustomInput';

  return (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        customInput={<CustomInput value={selected ? formatDate(selected) : ''} />}
        dateFormat="MMMM d, yyyy"
        minDate={minDate}
        maxDate={maxDate}
        filterDate={disabled ? (date) => !disabled(date) : undefined}
        popperClassName="z-50"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        className="w-full"
        calendarClassName="shadow-lg border border-gray-200 rounded-lg"
        dayClassName={(date) =>
          cn(
            "hover:bg-accent hover:text-accent-foreground",
            "focus:bg-primary focus:text-primary-foreground",
            "aria-selected:bg-primary aria-selected:text-primary-foreground",
            "rounded-md"
          )
        }
        weekDayClassName={() => "text-muted-foreground font-medium text-sm"}
        monthClassName={() => "text-foreground"}
        timeClassName={() => "text-foreground"}
      />
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .react-datepicker__header {
          background-color: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 0.75rem;
        }
        
        .react-datepicker__current-month {
          color: hsl(var(--foreground));
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .react-datepicker__day-names {
          margin-bottom: 0.5rem;
        }
        
        .react-datepicker__day-name {
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          font-size: 0.75rem;
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
        }
        
        .react-datepicker__month {
          margin: 0.5rem;
        }
        
        .react-datepicker__day {
          color: hsl(var(--foreground));
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          margin: 0.125rem;
          transition: all 0.2s;
        }
        
        .react-datepicker__day:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        
        .react-datepicker__day--selected {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        .react-datepicker__day--today {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          font-weight: 600;
        }
        
        .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .react-datepicker__day--outside-month {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }
        
        .react-datepicker__navigation {
          background: none;
          border: none;
          cursor: pointer;
          outline: none;
          top: 0.75rem;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .react-datepicker__navigation:hover {
          background-color: hsl(var(--accent));
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: hsl(var(--foreground));
          border-width: 2px 2px 0 0;
          width: 0.5rem;
          height: 0.5rem;
        }
        
        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;
