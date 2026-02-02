import { createGoogleMeetEvent } from './google-calendar';

/**
 * Generates a Google Meet link.
 * If Google Calendar API is configured, creates a real calendar event with Meet link.
 * Otherwise, generates a mock URL for development/testing.
 */
export function generateMeetLink(): string {
    // Generate a valid Google Meet code format: xxx-yyyy-zzz
    // Each segment uses lowercase letters only (Google Meet format)
    const segment1 = Math.random().toString(36).substring(2, 5); // 3 chars
    const segment2 = Math.random().toString(36).substring(2, 6); // 4 chars  
    const segment3 = Math.random().toString(36).substring(2, 5); // 3 chars
    return `https://meet.google.com/${segment1}-${segment2}-${segment3}`;
}

/**
 * Generates a Google Meet link with calendar event creation
 * @param eventDetails - Details for the calendar event
 * @param calendarId - Optional calendar ID where the event should be created
 * @returns Promise resolving to an object with meetLink and optional googleEventId
 */
export async function generateMeetLinkWithEvent(
    eventDetails: {
        summary: string;
        description?: string;
        startTime: Date;
        endTime: Date;
        attendees?: string[];
    },
    calendarId?: string
): Promise<{ meetLink: string; googleEventId?: string }> {
    // Try to create real Google Meet event
    const result = await createGoogleMeetEvent(eventDetails, calendarId);

    // Fallback to mock URL if API is not configured or fails
    if (!result) {
        return { meetLink: generateMeetLink() };
    }

    return {
        meetLink: result.meetLink,
        googleEventId: result.eventId
    };
}
