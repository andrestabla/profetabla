/**
 * Google Calendar Integration - v2.0
 * Fixed: Domain-Wide Delegation issue by removing attendees field
 */
import { google } from 'googleapis';
import { getSafePlatformConfig } from './config';

/**
 * Creates a Google Calendar event with a Google Meet link
 * @param eventDetails - Details for the calendar event
 * @param calendarId - Optional specific calendar ID (defaults to 'primary')
 * @returns Object containing the Meet link and the Google Event ID, or null if creation fails
 */
export async function createGoogleMeetEvent(
    eventDetails: {
        summary: string;
        description?: string;
        startTime: Date;
        endTime: Date;
        attendees?: string[];
    },
    calendarId = 'primary'
): Promise<{ meetLink: string; eventId: string } | null> {
    try {
        const config = await getSafePlatformConfig();

        // Check if Google Calendar is enabled and configured
        if (!config.googleCalendarEnabled || !config.googleCalendarServiceAccountJson) {
            console.log('Google Calendar not configured, skipping event creation');
            return null;
        }

        // Parse service account credentials
        let credentials;
        try {
            credentials = JSON.parse(config.googleCalendarServiceAccountJson);
        } catch {
            console.error('CRITICAL: Failed to parse Google Calendar Service Account JSON. Check if it is a valid single-line string in .env');
            return null;
        }

        // Create JWT auth client
        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Create calendar event with Google Meet
        const event = {
            summary: eventDetails.summary,
            description: eventDetails.description || '',
            start: {
                dateTime: eventDetails.startTime.toISOString(),
                timeZone: 'America/Bogota', // TODO: Use platform timezone from config
            },
            end: {
                dateTime: eventDetails.endTime.toISOString(),
                timeZone: 'America/Bogota',
            },
            // NOTE: Service accounts cannot invite attendees without Domain-Wide Delegation
            // Students will access the Meet link through the platform instead
            // attendees: eventDetails.attendees?.map(email => ({ email })) || [],
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        console.log(`[Calendar] Creating event in calendar: "${calendarId}"`);
        console.log(`[Calendar] Event details:`, {
            summary: event.summary,
            start: event.start.dateTime,
            end: event.end.dateTime
        });

        const response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
            conferenceDataVersion: 1,
        });

        // Extract Google Meet link
        const meetLink = response.data.conferenceData?.entryPoints?.find(
            ep => ep.entryPointType === 'video'
        )?.uri;

        const eventId = response.data.id;

        console.log(`[Calendar] ✅ Event created successfully!`);
        console.log(`[Calendar] Event ID: ${eventId}`);
        console.log(`[Calendar] Meet link: ${meetLink}`);
        console.log(`[Calendar] Calendar used: ${calendarId}`);

        if (meetLink && eventId) {
            return { meetLink, eventId };
        }
        return null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Calendar] ❌ Error creating event in calendar "${calendarId}":`, errorMessage);
        // If specific calendar fails (e.g. not shared), try primary as fallback
        if (calendarId !== 'primary') {
            console.log(`[Calendar] ⚠️ Retrying with 'primary' calendar as fallback...`);
            return createGoogleMeetEvent(eventDetails, 'primary');
        }
        return null;
    }
}

/**
 * Deletes a Google Calendar event
 * @param eventId - The ID of the event to delete
 * @param calendarId - The ID of the calendar containing the event
 */
export async function deleteGoogleCalendarEvent(eventId: string, calendarId = 'primary'): Promise<boolean> {
    try {
        const config = await getSafePlatformConfig();
        if (!config.googleCalendarServiceAccountJson) return false;

        const credentials = JSON.parse(config.googleCalendarServiceAccountJson);
        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });
        await calendar.events.delete({
            calendarId,
            eventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        return false;
    }
}

/**
 * Tests the Google Calendar API connection
 * @returns Success status and message
 */
export async function testGoogleCalendarConnection(): Promise<{ success: boolean; message: string }> {
    try {
        const config = await getSafePlatformConfig();

        if (!config.googleCalendarServiceAccountJson) {
            return { success: false, message: 'No se ha configurado la cuenta de servicio de Google Calendar' };
        }

        const credentials = JSON.parse(config.googleCalendarServiceAccountJson);

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Test by listing calendars
        await calendar.calendarList.list();

        return { success: true, message: 'Conexión exitosa con Google Calendar API' };
    } catch (error) {
        console.error('Google Calendar connection test failed:', error);
        return {
            success: false,
            message: `Error al conectar con Google Calendar: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
    }
}
