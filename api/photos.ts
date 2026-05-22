const FALLBACK_FILENAMES = [
  "PE1_1760447738195.jpg",
  "PE2_1760447738196.jpg",
  "PE3_1760447738196.jpg",
  "PE4_1760447738196.jpg",
  "PE5_1760447738196.jpg",
  "PE6_1760447738197.jpg",
  "PE7_1760447738197.jpg",
  "PE8_1760447738197.jpg",
  "PE9_1760447738197.jpg",
  "PE10_1760447738198.jpg",
  "PE12_1760447738198.jpg",
  "PE13_1760447738198.jpg",
  "PE14_1760447738198.jpg",
  "PE15_1760447738198.jpg",
  "PE16_1760447738199.jpg",
  "PE18_1760447738199.jpg",
  "PE19_1760447738199.jpg",
  "PE20_1760447738199.jpg",
  "Before 1_1760447377966.jpg",
  "PE21_1760449066498.jpg",
  "PE22_1760449066499.jpg",
  "PE23_1760449066499.jpg",
  "PE24_1760449066499.jpg",
  "PE25_1760449066499.jpg",
  "PE26_1760449066499.jpg",
  "PE27_1760449066500.jpg",
  "PE28_1760449066500.jpg",
];

function fallbackPhotos() {
  return FALLBACK_FILENAMES.map((filename, index) => ({
    id: `fallback-${index + 1}`,
    filename,
    category: filename.startsWith("Before") ? "Before and After" : "Project Showcase",
    description: `P&E Premium Flooring project photo ${index + 1}`,
    displayOrder: index + 1,
    createdAt: new Date(0).toISOString(),
  }));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  return res.status(200).json({
    success: true,
    data: fallbackPhotos(),
  });
}
