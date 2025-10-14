import { Layers, Grid3x3, Home, Square, Bath } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Services() {
  const services = [
    {
      icon: Layers,
      title: "Luxury Vinyl Plank (LVP)",
      description:
        "Durable, waterproof, and beautiful LVP flooring that looks like real hardwood at a fraction of the cost.",
      details: [
        "Perfect for high-traffic areas and moisture-prone spaces",
        "Wide variety of wood-look and stone-look styles",
        "Easy maintenance and scratch-resistant",
        "Professional installation with proper underlayment",
      ],
      pricing: "Typically $3-$7 per sq ft installed (material + labor). Final price depends on product selection and room preparation needs.",
    },
    {
      icon: Grid3x3,
      title: "Tile Installation",
      description:
        "Expert tile installation for kitchens, bathrooms, and any room where you need style and durability.",
      details: [
        "Ceramic, porcelain, and natural stone options",
        "Custom patterns and designs available",
        "Precision cutting and leveling for flawless finish",
        "Proper waterproofing and substrate preparation",
      ],
      pricing: "Typically $8-$15 per sq ft installed. Pricing varies based on tile selection, pattern complexity, and surface preparation.",
    },
    {
      icon: Home,
      title: "Hardwood Flooring",
      description:
        "Classic hardwood installation and refinishing services that add timeless elegance to your home.",
      details: [
        "Solid hardwood and engineered wood installation",
        "Hardwood refinishing and restoration",
        "Custom staining and finishing options",
        "Repairs and matching to existing floors",
      ],
      pricing: "Installation typically $6-$12 per sq ft. Refinishing typically $3-$5 per sq ft. Pricing depends on wood species and finish selection.",
    },
    {
      icon: Square,
      title: "Countertop Installation",
      description:
        "Professional countertop installation for kitchens and bathrooms using premium materials.",
      details: [
        "Laminate, quartz, granite, and solid surface options",
        "Precision templating and custom fabrication",
        "Undermount and drop-in sink cutouts",
        "Backsplash installation available",
      ],
      pricing: "Varies widely by material: Laminate $20-$50/sq ft, Quartz $60-$120/sq ft, Granite $50-$100/sq ft installed.",
    },
    {
      icon: Bath,
      title: "Bathroom & Kitchen Tile",
      description:
        "Specialized tile work for wet areas, including shower surrounds, backsplashes, and floors.",
      details: [
        "Shower wall and floor tile installation",
        "Kitchen and bathroom backsplashes",
        "Accent walls and decorative tile work",
        "Complete waterproofing systems",
      ],
      pricing: "Shower tiling typically $12-$25 per sq ft. Backsplashes typically $10-$20 per sq ft. Complex patterns may cost more.",
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-background" id="services">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-heading font-semibold text-foreground mb-4">
            Our Services
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive flooring solutions for residential and commercial
            properties throughout Milwaukee Metro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover-elevate transition-all overflow-visible"
                data-testid={`card-service-${index}`}
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">
                    {service.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger 
                        className="text-sm font-medium text-primary hover:text-primary/80 py-2"
                        data-testid={`accordion-service-${index}`}
                      >
                        View Details & Pricing
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-foreground mb-2 text-sm">
                              What's Included:
                            </h4>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                              {service.details.map((detail, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-ring mr-2 mt-0.5">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="pt-2 border-t">
                            <h4 className="font-medium text-foreground mb-1.5 text-sm">
                              Pricing Guide:
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {service.pricing}
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-2 italic">
                              Call for a free estimate tailored to your project
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
