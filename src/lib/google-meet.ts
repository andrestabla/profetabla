/**
 * Generates a Google Meet link.
 * In a production environment, this would interface with the Google Calendar API.
 * For this MVP, we generate a unique meeting ID using the current timestamp and a random string.
 */
export function generateMeetLink(): string {
    const randomId = Math.random().toString(36).substring(2, 5) + '-' +
        Math.random().toString(36).substring(2, 6) + '-' +
        Math.random().toString(36).substring(2, 5);
    return `https://meet.google.com/${randomId}`;
}
