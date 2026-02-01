import { google } from 'googleapis';
import { getSafePlatformConfig } from './config';

/**
 * Creates a Google Calendar event with a Google Meet link
 * @param eventDetails - Details for the calendar event
 * @returns The Google Meet link or null if creation fails
 */
export async function createGoogleMeetEvent(eventDetails: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
}): Promise<string | null> {
    try {
        const config = await getSafePlatformConfig();

        // Check if Google Calendar is enabled and configured
        if (!config.googleCalendarEnabled || !config.googleCalendarServiceAccountJson) {
            console.log('Google Calendar not configured, skipping event creation');
            return null;
        }

        // Parse service account credentials
        const credentials = JSON.parse(config.googleCalendarServiceAccountJson);

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
            attendees: eventDetails.attendees?.map(email => ({ email })) || [],
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
        });

        // Extract Google Meet link
        const meetLink = response.data.conferenceData?.entryPoints?.find(
            ep => ep.entryPointType === 'video'
        )?.uri;

        return meetLink || null;
    } catch (error) {
        console.error('Error creating Google Meet event:', error);
        return null;
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
