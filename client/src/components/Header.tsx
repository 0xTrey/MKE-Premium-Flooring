import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-sm shadow-md"
          : "bg-background"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-xl lg:text-2xl font-heading font-bold text-primary">
              P&E Premium Flooring
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+14142751889"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              data-testid="link-phone-header"
            >
              <Phone className="w-5 h-5" />
              <span className="font-heading font-semibold text-lg">
                (414) 275-1889
              </span>
            </a>
          </div>

          <Button
            onClick={scrollToContact}
            size="default"
            className="bg-ring text-white border-ring font-heading font-semibold"
            data-testid="button-header-cta"
          >
            <span className="hidden sm:inline">Call for a Free Estimate</span>
            <span className="sm:hidden">Free Estimate</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
