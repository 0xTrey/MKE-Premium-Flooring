import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
import before3 from "@assets/Before 1_1760447377966.jpg";
import after3 from "@assets/After 1_1760447377966.jpg";

function CompareSlider({ before, after }: { before: string; after: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging && e.type !== 'touchmove') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };
  
  return (
    <div
      className="relative aspect-[4/3] overflow-hidden select-none cursor-ew-resize"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleMove}
      data-testid="comparison-slider"
    >
      <img
        src={after}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <img
        src={before}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
        }}
      />
      <div
        className="absolute top-0 bottom-0 w-1 bg-ring cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ring border-4 border-white shadow-lg flex items-center justify-center">
          <MoveHorizontal className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="absolute bottom-6 left-6 bg-black/70 text-white px-4 py-2 rounded-md text-base font-medium">
        Before
      </div>
      <div className="absolute bottom-6 right-6 bg-black/70 text-white px-4 py-2 rounded-md text-base font-medium">
        After
      </div>
    </div>
  );
}

export function BeforeAfter() {
  return (
    <section className="py-16 lg:py-24 bg-muted/30" id="before-after">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-heading font-semibold text-foreground mb-4">
            Before & After
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            See the dramatic transformation we achieved for this Milwaukee area bathroom.
            Drag the slider to compare.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card" data-testid="comparison-0">
          <CompareSlider before={before3} after={after3} />
          <div className="p-6">
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              Bathroom Tile Installation
            </h3>
            <p className="text-muted-foreground">
              Complete bathroom transformation with modern tile installation and a perfect finish
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to transform your space?
          </p>
          <a
            href="tel:+14142751889"
            className="inline-flex items-center justify-center rounded-md bg-ring text-white px-6 py-3 font-medium hover-elevate active-elevate-2 transition-all"
            data-testid="button-beforeafter-call"
          >
            Call (414) 275-1889 for Free Estimate
          </a>
        </div>
      </div>
    </section>
  );
}
