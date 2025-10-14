import { Facebook } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">
              P&E Premium Flooring
            </h3>
            <p className="text-primary-foreground/80 mb-4">
              Quality flooring installation serving Milwaukee Metro for over 10 years.
            </p>
            <a
              href="https://www.facebook.com/profile.php?id=100092361378518"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-foreground hover:text-ring transition-colors"
              data-testid="link-facebook-footer"
            >
              <Facebook className="w-5 h-5" />
              Follow us on Facebook
            </a>
          </div>

          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  data-testid="link-about"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  data-testid="link-services"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("gallery")}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  data-testid="link-gallery"
                >
                  Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  data-testid="link-contact"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <a
                  href="tel:+14142751889"
                  className="hover:text-primary-foreground transition-colors"
                  data-testid="link-phone-footer"
                >
                  (414) 275-1889
                </a>
              </li>
              <li>
                <a
                  href="mailto:Pepremiumflooring@gmail.com"
                  className="hover:text-primary-foreground transition-colors break-all"
                  data-testid="link-email-footer"
                >
                  Pepremiumflooring@gmail.com
                </a>
              </li>
              <li>Milwaukee Metro Area</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60 text-sm">
          <p>&copy; {currentYear} P&E Premium Flooring. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
