import { listPhotos } from "../server/public/site-data";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const photos = await listPhotos();
    return res.status(200).json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
