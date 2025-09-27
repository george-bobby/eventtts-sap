# Issue Reporting System

This feature allows users to report issues with events directly from their booked tickets in the tickets page. **The system automatically sends detailed email notifications to the event creator's email address that was saved during event creation.**

## 🎯 **Key Concept: Issue Reporting for Booked Events Only**

The "Report Issue" functionality is strategically placed in the **Tickets page** rather than the explore events page because:

1. **Authentic Issues**: Only users who have actually booked/purchased tickets can report issues
2. **Legitimate Concerns**: Prevents spam or false reports from non-attendees
3. **User Context**: Users can report issues for events they have a genuine stake in
4. **Better UX**: Centralized location for managing all booked events and their related issues

## 📧 Email Delivery System

### How Organizer Emails Are Retrieved

1. **Event Creation**: When an organizer creates an event, their user ID is stored in the `organizer` field
2. **User Model**: The organizer's email is stored in the User model during account registration
3. **Issue Reporting**: When an issue is reported:
   - System fetches the event with populated organizer details
   - Extracts the organizer's email from the User model
   - Sends detailed email notification immediately
   - Stores organizer email in the issue record for tracking

### Email Content Personalization

The system creates highly personalized emails including:
- **Personal Greeting**: "Dear [Organizer Name]"
- **Event Details**: Event title and organizer name
- **Issue Context**: Full issue details with priority indicators
- **Contact Information**: Direct access to reporter's email
- **Action Buttons**: Quick links to contact reporter and view event

## Features

### 🚨 Issue Reporting
- **Ticket-Based Access**: "Report Issue" button only appears on booked events in the tickets page
- **Modal Interface**: Quick access via modal dialog for better UX
- **Alternative Page**: Dedicated issue reporting page as fallback
- **Comprehensive Form**: Structured issue reporting with categories and severity levels
- **Authenticated Users Only**: Only logged-in users with booked tickets can report issues

### 📋 Issue Categories

1. **Event Information Issue** 📅
   - Wrong date/time
   - Wrong location/venue
   - Speaker/performer details incorrect
   - Event description inaccurate
   - Missing important information

2. **Tickets & Registration** 🎫
   - Unable to purchase ticket
   - Ticket not received
   - Ticket not scanning at entry
   - Refund/transfer issue
   - Registration system error

3. **Event Experience** 🎭
   - Accessibility problem
   - Live stream not working
   - Facilities issue (parking, seating, food)
   - Audio/video technical issues
   - Poor event organization

4. **Payments** 💳
   - Charged incorrectly
   - Invoice/tax issue
   - Payment processing error
   - Refund not processed

5. **Other** 📝
   - General complaint or feedback
   - Safety concern
   - Harassment report
   - Technical issue with platform

### 🎯 Priority Levels

- **🟢 Low Priority**: Not urgent, just FYI
- **🟡 Medium Priority**: Affects me, but event can continue
- **🔴 High Priority**: Urgent, blocking participation

### ✨ Advanced Features

- **File Attachments**: Users can upload screenshots, photos, or documents
- **Auto-filled Context**: System automatically captures event details, user info, and timestamp
- **Email Notifications**: Instant email alerts to event organizers using their saved email addresses
- **Professional Email Template**: Rich HTML email with issue details and styling
- **Robust Error Handling**: System ensures emails are delivered even if minor issues occur
- **Debug Logging**: Comprehensive logging for troubleshooting email delivery

## How It Works

1. **User Books Event**: User purchases tickets for an event
2. **Access Tickets Page**: User navigates to their tickets page to view booked events
3. **Report Issue**: User clicks "Report Issue" button on any booked event card
4. **System Processing**: 
   - Validates user authentication and ticket ownership
   - Fetches event details with organizer information populated
   - Retrieves organizer's email from User model
   - Creates issue record in database
5. **Email Notification**: 
   - Generates personalized HTML email with all issue details
   - Sends to organizer's email address immediately
   - Includes direct contact links and event management options
6. **Confirmation**: User receives success confirmation with issue tracking ID

## Email Template Features

- **Priority-based Color Coding**: Visual indication of issue severity
- **Comprehensive Details**: All issue information in organized sections
- **Direct Action Buttons**: Contact reporter and view event links
- **Professional Design**: Clean, branded email template
- **Responsive Layout**: Works on all email clients

## Database Schema

The system uses a dedicated `Issue` model with the following fields:
- Event and reporter information
- Issue categorization and severity
- Status tracking (open, in-progress, resolved, closed)
- Attachment support
- Audit trail with timestamps

## Usage

### For Users
1. **Book an Event**: Purchase tickets for events you want to attend
2. **Navigate to Tickets Page**: Go to your tickets/bookings page  
3. **Find Your Event**: Locate the event you need help with
4. **Click "Report Issue"**: Use the orange-themed button on the event card
5. **Fill Out Form**: Complete the structured issue form
6. **Submit**: Receive confirmation and issue tracking ID
7. **Get Help**: Organizer receives notification and can contact you directly

### For Event Organizers
1. Receive email notification immediately
2. Review issue details in structured format
3. Contact reporter directly if needed
4. Track issue resolution status

## Technical Implementation

- **Frontend**: React components with TypeScript
- **Backend**: Server actions with MongoDB
- **Email**: Resend API with rich HTML templates
- **UI**: shadcn/ui components with consistent styling
- **Validation**: Client and server-side form validation

## File Structure

```
├── app/
│   ├── (root)/
│   │   ├── tickets/page.tsx           # Tickets page with Report Issue buttons
│   │   └── event/[id]/report-issue/
│   │       └── page.tsx               # Issue reporting page (fallback)
│   └── api/issues/
│       └── route.ts                   # API endpoints for issues
├── components/shared/
│   ├── OrderCard.tsx                  # Ticket card with Report Issue button
│   ├── OrderCards.tsx                 # Container for ticket cards
│   ├── IssueReportForm.tsx            # Main issue form component
│   └── RaiseIssueButton.tsx           # Modal trigger button
├── lib/
│   ├── actions/issue.action.ts        # Server actions for issues
│   ├── models/issue.model.ts          # Database schema
│   └── utils/email-test.ts            # Email testing utilities
```

## Environment Variables

Make sure you have the Resend API key configured:
```
RESEND_API_KEY=your_resend_api_key
```

## Testing Email Functionality

To test that emails are being sent correctly to event organizers:

1. **Use the Email Test Utility**:
   ```typescript
   import { testEmailSending } from '@/lib/utils/email-test';
   
   // Test email delivery to an organizer
   await testEmailSending('organizer@example.com', 'John Doe');
   ```

2. **Check Console Logs**: The system logs detailed information about email sending:
   ```
   Creating issue for event: [eventId] by user: [userId]
   Sending issue report email to organizer: organizer@example.com
   Issue details: { eventTitle, organizerName, reporterName, category, severity, title }
   Issue notification email sent successfully to organizer: organizer@example.com
   ```

3. **Verify Database Records**: Check that issues are created with correct organizer email addresses

## Troubleshooting

### Common Issues and Solutions

1. **Email Not Received**:
   - Check spam/junk folders
   - Verify RESEND_API_KEY is correctly configured
   - Check console logs for email sending errors
   - Ensure organizer email exists in User model

2. **Missing Organizer Information**:
   - Verify event has valid organizer reference
   - Check that User model contains email field
   - Ensure database population is working correctly

3. **Email Formatting Issues**:
   - Check HTML template rendering
   - Verify all required fields are populated
   - Test email client compatibility

## Future Enhancements

- **Admin Dashboard**: Interface for managing reported issues
- **Status Updates**: Email notifications when issues are resolved
- **Analytics**: Issue reporting metrics and trends
- **Integration**: Connect with support ticket systems
- **Mobile Optimization**: Enhanced mobile experience