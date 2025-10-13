import { Layers, Grid3x3, Home, Square, Bath } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function Services() {
  const services = [
    {
      icon: Layers,
      title: "Luxury Vinyl Plank (LVP)",
      description:
        "Durable, waterproof, and beautiful LVP flooring that looks like real hardwood at a fraction of the cost.",
    },
    {
      icon: Grid3x3,
      title: "Tile Installation",
      description:
        "Expert tile installation for kitchens, bathrooms, and any room where you need style and durability.",
    },
    {
      icon: Home,
      title: "Hardwood Flooring",
      description:
        "Classic hardwood installation and refinishing services that add timeless elegance to your home.",
    },
    {
      icon: Square,
      title: "Countertop Installation",
      description:
        "Professional countertop installation for kitchens and bathrooms using premium materials.",
    },
    {
      icon: Bath,
      title: "Bathroom & Kitchen Tile",
      description:
        "Specialized tile work for wet areas, including shower surrounds, backsplashes, and floors.",
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
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
