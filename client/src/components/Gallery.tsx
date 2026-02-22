import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Photo } from "@shared/schema";
import { Pause, Play } from "lucide-react";
import { Button } from "./ui/button";

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
import pe21 from "@assets/PE21_1760449066498.jpg";
import pe22 from "@assets/PE22_1760449066499.jpg";
import pe23 from "@assets/PE23_1760449066499.jpg";
import pe24 from "@assets/PE24_1760449066499.jpg";
import pe25 from "@assets/PE25_1760449066499.jpg";
import pe26 from "@assets/PE26_1760449066499.jpg";
import pe27 from "@assets/PE27_1760449066500.jpg";
import pe28 from "@assets/PE28_1760449066500.jpg";

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
  "PE21_1760449066498.jpg": pe21,
  "PE22_1760449066499.jpg": pe22,
  "PE23_1760449066499.jpg": pe23,
  "PE24_1760449066499.jpg": pe24,
  "PE25_1760449066499.jpg": pe25,
  "PE26_1760449066499.jpg": pe26,
  "PE27_1760449066500.jpg": pe27,
  "PE28_1760449066500.jpg": pe28,
};

export function Gallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(0.5);

  const { data, isLoading } = useQuery<{ success: boolean; data: Photo[] }>({
    queryKey: ["/api/photos"],
  });

  const photos = data?.data || [];
  const duplicatedPhotos = photos.length > 0 ? [...photos, ...photos] : [];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || photos.length === 0 || isPaused) return;

    const scroll = () => {
      if (!scrollContainer) return;

      scrollContainer.scrollLeft += scrollSpeedRef.current;

      const halfWidth = scrollContainer.scrollWidth / 2;
      if (scrollContainer.scrollLeft >= halfWidth) {
        scrollContainer.scrollLeft -= halfWidth;
      }

      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [photos.length, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

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
      </div>

      {isLoading ? (
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 h-64 bg-primary-foreground/10 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-hidden px-6 lg:px-8"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            data-testid="gallery-carousel"
          >
            {duplicatedPhotos.map((photo, index) => (
              <div
                key={`${photo.id}-${index}`}
                className="group relative flex-shrink-0 w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 overflow-hidden rounded-lg"
                data-testid={`img-gallery-${index}`}
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

          <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-6 flex justify-center">
            <Button
              size="icon"
              variant="outline"
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Play carousel" : "Pause carousel"}
              data-testid="button-pause-carousel"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
