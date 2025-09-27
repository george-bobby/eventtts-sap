/**
 * Test utility to verify issue reporting email functionality
 * This helps ensure that the event organizer email system is working correctly
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function testEmailSending(organizerEmail: string, organizerName: string) {
    const testEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #f9fafb;
                padding: 20px;
            }
            .card { 
                background: white; 
                border-radius: 12px; 
                padding: 24px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                color: white; 
                padding: 20px; 
                border-radius: 12px; 
                margin-bottom: 20px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Email System Test</h1>
                <p>Testing issue reporting email functionality</p>
            </div>
            
            <div class="card">
                <h2>Hello ${organizerName}!</h2>
                <p>This is a test email to verify that the issue reporting system can successfully send emails to event organizers.</p>
                
                <h3>Test Details:</h3>
                <ul>
                    <li><strong>Recipient:</strong> ${organizerEmail}</li>
                    <li><strong>Organizer Name:</strong> ${organizerName}</li>
                    <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
                    <li><strong>System:</strong> SAP Hackathon Event Management</li>
                </ul>
                
                <p>If you received this email, the issue reporting system is working correctly! 🎉</p>
                
                <div style="background-color: #f0f9f4; padding: 16px; border-radius: 8px; margin-top: 16px;">
                    <p><strong>Note:</strong> This is a test email. In production, you would receive detailed issue reports from event attendees with all the necessary information to resolve their concerns.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const result = await resend.emails.send({
            from: 'SAP Hackathon Events <noreply@saphackathon.com>',
            to: [organizerEmail],
            subject: '✅ [TEST] Issue Reporting System - Email Test',
            html: testEmailHtml,
        });

        console.log('Test email sent successfully:', result);
        return { success: true, result };
    } catch (error) {
        console.error('Failed to send test email:', error);
        return { success: false, error };
    }
}

// Example usage:
// await testEmailSending('organizer@example.com', 'John Doe');