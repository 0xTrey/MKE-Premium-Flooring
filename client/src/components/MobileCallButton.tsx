import { Phone } from "lucide-react";

export function MobileCallButton() {
  return (
    <a
      href="tel:+14142751889"
      aria-label="Call P&E Premium Flooring"
      className="fixed bottom-4 left-4 right-4 z-50 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ring px-4 text-center text-base font-heading font-semibold text-white shadow-xl md:hidden"
      data-testid="button-mobile-call"
    >
      <Phone className="h-6 w-6 flex-shrink-0" />
      <span className="truncate">Call for Free Estimate</span>
    </a>
  );
}
