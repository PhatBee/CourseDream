import { google } from 'googleapis';
import streamifier from 'streamifier';

const clientId = process.env.GOOGLE_CLIENT_ID_YOUTUBE;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
// const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN; // Cần lấy token này một lần

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

// Set credentials (giả sử bạn đã có refresh token để server tự động renew access token)
if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
}

const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
});

/**
 * Upload video buffer lên YouTube
 */
export const uploadToYouTube = async (fileBuffer, title, description) => {
    try {
        const res = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: title,
                    description: description,
                },
                status: {
                    privacyStatus: 'unlisted', // Hoặc 'public', 'private'
                },
            },
            media: {
                body: streamifier.createReadStream(fileBuffer),
            },
        });

        // Trả về Video ID và URL
        return {
            videoId: res.data.id,
            videoUrl: `https://www.youtube.com/watch?v=${res.data.id}`
        };
    } catch (error) {
        console.error('YouTube Upload Error:', error);
        throw error;
    }
};