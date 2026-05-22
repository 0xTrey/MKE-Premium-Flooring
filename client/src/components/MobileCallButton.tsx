import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileCallButton() {
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 md:hidden" data-testid="mobile-call-container">
      <Button
        asChild
        size="lg"
        className="h-14 w-full rounded-full bg-ring text-base font-heading font-semibold text-white shadow-xl border-ring"
      >
        <a 
          href="tel:+14142751889" 
          aria-label="Call P&E Premium Flooring" 
          className="flex items-center justify-center gap-2"
          data-testid="button-mobile-call"
        >
          <Phone className="w-6 h-6" />
          Call for Free Estimate
        </a>
      </Button>
    </div>
  );
}
