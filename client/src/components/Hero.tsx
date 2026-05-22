import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import heroImage from "@assets/stock_images/luxury_vinyl_plank_f_9e5fa553.jpg";

export function Hero() {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="relative flex min-h-[calc(100svh-72px)] items-center justify-center py-20 sm:min-h-[600px] sm:py-24"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-5 inline-block sm:mb-6">
          <div className="rounded-lg border border-white/30 bg-ring/20 px-3 py-2 backdrop-blur-sm sm:px-4">
            <p className="text-xs font-heading font-semibold text-white sm:text-sm lg:text-base">
              10+ Years of Excellence
            </p>
          </div>
        </div>

        <h1 className="mx-auto mb-5 max-w-[10.5ch] text-3xl font-heading font-bold leading-[1.08] text-white text-balance min-[375px]:text-4xl sm:max-w-none sm:text-5xl lg:mb-6 lg:text-7xl">
          Quality Flooring.<br />Affordable Prices.
        </h1>

        <p className="mx-auto mb-8 max-w-3xl text-base font-medium text-white/90 sm:text-lg lg:mb-12 lg:text-2xl">
          Serving Milwaukee Metro with premium flooring and tile installation.
        </p>

        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            asChild
            size="lg"
            className="w-full max-w-[calc(100vw-2rem)] bg-ring px-4 text-sm text-white border-ring font-heading font-semibold min-[375px]:text-base sm:w-auto sm:text-lg"
            data-testid="button-hero-call"
          >
            <a href="tel:+14142751889" className="flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call (414) 275-1889
            </a>
          </Button>

          <Button
            onClick={scrollToContact}
            size="lg"
            variant="outline"
            className="w-full max-w-[calc(100vw-2rem)] border-2 border-white/30 bg-white/10 px-4 text-sm text-white backdrop-blur-md font-heading font-semibold min-[375px]:text-base sm:w-auto sm:text-lg"
            data-testid="button-hero-contact"
          >
            <Mail className="mr-2 h-5 w-5" />
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}
