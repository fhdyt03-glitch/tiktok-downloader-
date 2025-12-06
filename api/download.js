import fetch from "node-fetch";
import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const tiktokUrl = req.query.url || "";
    if (!tiktokUrl) {
      res.status(400).json({ error: "URL tidak ditemukan" });
      return;
    }

    // Fetch halaman TikTok
    const page = await fetch(tiktokUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await page.text();
    const $ = cheerio.load(html);

    // Ambil video dari meta tag
    let videoUrl =
      $('meta[property="og:video"]').attr("content") ||
      $('meta[property="twitter:player:stream"]').attr("content");

    // fallback parsing JSON
    if (!videoUrl) {
      const match = html.match(/"playAddr":"(https:[^"]+)"/);
      if (match) {
        videoUrl = match[1].replace(/\\u0026/g, "&");
      }
    }

    if (!videoUrl) {
      res.status(404).json({ error: "Video tidak ditemukan" });
      return;
    }

    // Download video asli
    const video = await fetch(videoUrl, {
      headers: { Referer: tiktokUrl },
    });

    const buffer = await video.buffer();

    // Kirim sebagai file
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tiktok-video.mp4"
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
