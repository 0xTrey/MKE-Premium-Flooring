import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function About() {
  const stats = [
    { number: "10+", label: "Years Experience" },
    { number: "100%", label: "Quality Guarantee" },
    { number: "Fast", label: "Turnaround" },
  ];

  const highlights = [
    "LVP, tile, and hardwood installation",
    "Bathroom and kitchen tile work",
    "Countertop installation",
    "Competitive pricing",
    "High-quality craftsmanship",
  ];

  return (
    <section className="py-16 lg:py-24 bg-card" id="about">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-5xl font-heading font-semibold text-foreground mb-6">
              Expert Flooring Installation for Milwaukee Metro
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Over 10 years of experience delivering beautiful, durable flooring
              for homes and businesses throughout the Milwaukee area. We take
              pride in our attention to detail and commitment to customer
              satisfaction.
            </p>

            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                  data-testid={`text-highlight-${index}`}
                >
                  <CheckCircle2 className="w-6 h-6 text-ring flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="overflow-visible"
                data-testid={`card-stat-${index}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl lg:text-5xl font-heading font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm lg:text-base text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
