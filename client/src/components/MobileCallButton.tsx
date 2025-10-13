import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileCallButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden" data-testid="mobile-call-container">
      <Button
        asChild
        size="icon"
        className="bg-ring text-white border-ring shadow-xl rounded-full"
      >
        <a 
          href="tel:+14142751889" 
          aria-label="Call us" 
          className="flex items-center justify-center"
          data-testid="button-mobile-call"
        >
          <Phone className="w-6 h-6" />
        </a>
      </Button>
    </div>
  );
}
