// src/services/uploadToDrive.js

import { google } from "googleapis";
import fs from "fs";

export async function uploadToDrive(zipPath, projectName = "") {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json", // Google Service Account JSON anahtarı
      scopes: ["https://www.googleapis.com/auth/drive.file"]
    });

    const driveService = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: `${projectName}_Ciktisi.zip`,
      parents: ["<DRIVE_FOLDER_ID>"] // İlgili klasör ID'si
    };

    const media = {
      mimeType: "application/zip",
      body: fs.createReadStream(zipPath)
    };

    const file = await driveService.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink"
    });

    return `🔗 [Google Drive’da Görüntüle](${file.data.webViewLink})`;
  } catch (err) {
    console.error("Drive yükleme hatası:", err);
    return "❌ Google Drive yükleme başarısız oldu.";
  }
}
