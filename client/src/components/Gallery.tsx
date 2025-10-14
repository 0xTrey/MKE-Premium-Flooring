import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Photo } from "@shared/schema";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";

import pe1 from "@assets/PE1_1760447738195.jpg";
import pe2 from "@assets/PE2_1760447738196.jpg";
import pe3 from "@assets/PE3_1760447738196.jpg";
import pe4 from "@assets/PE4_1760447738196.jpg";
import pe5 from "@assets/PE5_1760447738196.jpg";
import pe6 from "@assets/PE6_1760447738197.jpg";
import pe7 from "@assets/PE7_1760447738197.jpg";
import pe8 from "@assets/PE8_1760447738197.jpg";
import pe9 from "@assets/PE9_1760447738197.jpg";
import pe10 from "@assets/PE10_1760447738198.jpg";
import pe12 from "@assets/PE12_1760447738198.jpg";
import pe13 from "@assets/PE13_1760447738198.jpg";
import pe14 from "@assets/PE14_1760447738198.jpg";
import pe15 from "@assets/PE15_1760447738198.jpg";
import pe16 from "@assets/PE16_1760447738199.jpg";
import pe18 from "@assets/PE18_1760447738199.jpg";
import pe19 from "@assets/PE19_1760447738199.jpg";
import pe20 from "@assets/PE20_1760447738199.jpg";
import before1 from "@assets/Before 1_1760447377966.jpg";

const photoAssets: Record<string, string> = {
  "PE1_1760447738195.jpg": pe1,
  "PE2_1760447738196.jpg": pe2,
  "PE3_1760447738196.jpg": pe3,
  "PE4_1760447738196.jpg": pe4,
  "PE5_1760447738196.jpg": pe5,
  "PE6_1760447738197.jpg": pe6,
  "PE7_1760447738197.jpg": pe7,
  "PE8_1760447738197.jpg": pe8,
  "PE9_1760447738197.jpg": pe9,
  "PE10_1760447738198.jpg": pe10,
  "PE12_1760447738198.jpg": pe12,
  "PE13_1760447738198.jpg": pe13,
  "PE14_1760447738198.jpg": pe14,
  "PE15_1760447738198.jpg": pe15,
  "PE16_1760447738199.jpg": pe16,
  "PE18_1760447738199.jpg": pe18,
  "PE19_1760447738199.jpg": pe19,
  "PE20_1760447738199.jpg": pe20,
  "Before 1_1760447377966.jpg": before1,
};

export function Gallery() {
  const [currentPage, setCurrentPage] = useState(0);
  const photosPerPage = 8;

  const { data, isLoading } = useQuery<{ success: boolean; data: Photo[] }>({
    queryKey: ["/api/photos"],
  });

  const photos = data?.data || [];
  const totalPages = Math.ceil(photos.length / photosPerPage);
  const startIndex = currentPage * photosPerPage;
  const displayedPhotos = photos.slice(startIndex, startIndex + photosPerPage);

  const handleSeeMore = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <section className="py-16 lg:py-24 bg-primary text-primary-foreground" id="gallery">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-heading font-semibold mb-4">
            Recent Work
          </h2>
          <p className="text-lg lg:text-xl text-primary-foreground/80 max-w-3xl mx-auto">
            Explore our portfolio of completed projects throughout Milwaukee Metro.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-primary-foreground/10 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                  data-testid={`img-gallery-${startIndex + index}`}
                >
                  <img
                    src={photoAssets[photo.filename]}
                    alt={photo.description}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-4">
                    <span className="text-white font-heading font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {photo.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {photos.length > photosPerPage && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleSeeMore}
                  variant="outline"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                  data-testid="button-see-more"
                >
                  See More
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="text-primary-foreground/60 text-sm mt-2">
                  Showing {startIndex + 1}-{Math.min(startIndex + photosPerPage, photos.length)} of {photos.length} photos
                </p>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-12">
          <p className="text-primary-foreground/80 text-lg">
            Follow us on{" "}
            <a
              href="https://www.facebook.com/profile.php?id=100092361378518"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-ring transition-colors"
              data-testid="link-facebook"
            >
              Facebook
            </a>{" "}
            for more photos and updates
          </p>
        </div>
      </div>
    </section>
  );
}
