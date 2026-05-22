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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-3 sm:min-h-20">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-heading font-bold leading-tight text-primary sm:text-xl sm:whitespace-normal lg:text-2xl">
              P&E Premium Flooring
            </h1>
            <a
              href="tel:+14142751889"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-primary md:hidden"
              data-testid="link-phone-header-mobile"
            >
              <Phone className="h-4 w-4" />
              <span>(414) 275-1889</span>
            </a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a
              href="tel:+14142751889"
              className="flex items-center gap-2 text-foreground transition-colors hover:text-primary"
              data-testid="link-phone-header"
            >
              <Phone className="h-5 w-5" />
              <span className="font-heading text-lg font-semibold">
                (414) 275-1889
              </span>
            </a>
          </div>

          <Button
            onClick={scrollToContact}
            size="default"
            className="hidden h-11 shrink-0 bg-ring px-4 font-heading font-semibold text-white border-ring sm:inline-flex"
            data-testid="button-header-cta"
          >
            Free Estimate
          </Button>
        </div>
      </div>
    </header>
  );
}
