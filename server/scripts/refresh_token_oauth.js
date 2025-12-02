import { google } from "googleapis";
import readline from "readline";
import dotenv from 'dotenv';
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID_YOUTUBE,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"
);

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
});

console.log("Mở link sau để cấp quyền:");
console.log(url);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("Nhập code sau khi login: ", async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("REFRESH TOKEN:", tokens.refresh_token);
    rl.close();
});
