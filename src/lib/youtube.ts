import { google } from 'googleapis';
import { prisma } from './prisma';

/**
 * Gets the YouTube client using the API Key from PlatformConfig.
 */
async function getYouTubeClient() {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    // Check for API Key in DB first, then Env
    const apiKey = config?.youtubeApiKey || process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.warn("YouTube API Key not configured.");
        return null;
    }

    return google.youtube({
        version: 'v3',
        auth: apiKey
    });
}

/**
 * Fetches video details (snippet) from YouTube Data API.
 */
export async function getVideoDetails(url: string) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) return null;

        const youtube = await getYouTubeClient();
        if (!youtube) return null;

        const response = await youtube.videos.list({
            part: ['snippet'],
            id: [videoId]
        });

        const item = response.data.items?.[0];
        if (!item?.snippet) return null;

        return {
            title: item.snippet.title,
            description: item.snippet.description,
            tags: item.snippet.tags || [],
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt
        };
    } catch (error) {
        console.error("Error fetching YouTube details:", error);
        return null;
    }
}

/**
 * Helper to extract ID from various YouTube URL formats.
 */
function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
