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
      className="relative h-[85vh] min-h-[600px] flex items-center justify-center"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="inline-block mb-6">
          <div className="bg-ring/20 backdrop-blur-sm border-2 border-white/30 rounded-lg px-4 py-2">
            <p className="text-white font-heading font-semibold text-sm lg:text-base">
              10+ Years of Excellence
            </p>
          </div>
        </div>

        <h1 className="text-5xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6">
          Quality Flooring.<br />Affordable Prices.
        </h1>

        <p className="text-xl lg:text-2xl text-white/90 font-medium mb-12 max-w-3xl mx-auto">
          Serving Milwaukee Metro with premium flooring and tile installation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-ring text-white border-ring font-heading font-semibold text-lg"
            data-testid="button-hero-call"
          >
            <a href="tel:+14142751889" className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call (414) 275-1889
            </a>
          </Button>

          <Button
            onClick={scrollToContact}
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-heading font-semibold text-lg"
            data-testid="button-hero-contact"
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}
