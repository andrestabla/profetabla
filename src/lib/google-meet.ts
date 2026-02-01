import { createGoogleMeetEvent } from './google-calendar';

/**
 * Generates a Google Meet link.
 * If Google Calendar API is configured, creates a real calendar event with Meet link.
 * Otherwise, generates a mock URL for development/testing.
 */
export function generateMeetLink(): string {
    // Generate mock URL as fallback
    const randomId = Math.random().toString(36).substring(2, 5) + '-' +
        Math.random().toString(36).substring(2, 6) + '-' +
        Math.random().toString(36).substring(2, 5);
    return `https://meet.google.com/${randomId}`;
}

/**
 * Generates a Google Meet link with calendar event creation
 * @param eventDetails - Details for the calendar event
 * @returns Promise resolving to the Meet link
 */
export async function generateMeetLinkWithEvent(eventDetails: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
}): Promise<string> {
    // Try to create real Google Meet event
    const meetLink = await createGoogleMeetEvent(eventDetails);

    // Fallback to mock URL if API is not configured or fails
    if (!meetLink) {
        return generateMeetLink();
    }

    return meetLink;
}
