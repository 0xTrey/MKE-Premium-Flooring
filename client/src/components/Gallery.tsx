import tile1 from "@assets/stock_images/beautiful_tile_floor_43517f39.jpg";
import tile2 from "@assets/stock_images/beautiful_tile_floor_f0561726.jpg";
import tile3 from "@assets/stock_images/beautiful_tile_floor_7989c2a8.jpg";
import hardwood1 from "@assets/stock_images/hardwood_floor_bedro_9890b4a5.jpg";
import hardwood2 from "@assets/stock_images/hardwood_floor_bedro_b9af14a5.jpg";
import hardwood3 from "@assets/stock_images/hardwood_floor_bedro_4a857681.jpg";
import bathroom1 from "@assets/stock_images/bathroom_tile_instal_c1df1830.jpg";
import bathroom2 from "@assets/stock_images/bathroom_tile_instal_fa5603c1.jpg";
import bathroom3 from "@assets/stock_images/bathroom_tile_instal_0aac14b6.jpg";
import countertop1 from "@assets/stock_images/countertop_installat_3bbcf4b8.jpg";
import countertop2 from "@assets/stock_images/countertop_installat_c64c326b.jpg";
import lvp from "@assets/stock_images/luxury_vinyl_plank_f_9e5fa553.jpg";

export function Gallery() {
  const galleryImages = [
    { src: lvp, alt: "Luxury Vinyl Plank Installation", label: "LVP Flooring" },
    { src: tile1, alt: "Kitchen Tile Installation", label: "Kitchen Tile" },
    { src: hardwood1, alt: "Hardwood Floor Installation", label: "Hardwood" },
    { src: bathroom1, alt: "Bathroom Tile Work", label: "Bathroom Tile" },
    { src: countertop1, alt: "Countertop Installation", label: "Countertops" },
    { src: tile2, alt: "Tile Flooring", label: "Tile Work" },
    { src: hardwood2, alt: "Hardwood Bedroom", label: "Hardwood" },
    { src: bathroom2, alt: "Modern Bathroom Tile", label: "Bathroom" },
    { src: tile3, alt: "Kitchen Floor Tile", label: "Kitchen" },
    { src: hardwood3, alt: "Elegant Hardwood", label: "Hardwood" },
    { src: bathroom3, alt: "Bathroom Installation", label: "Bathroom" },
    { src: countertop2, alt: "Kitchen Countertop", label: "Countertop" },
  ];

  return (
    <section className="py-16 lg:py-24 bg-primary text-primary-foreground" id="gallery">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-heading font-semibold mb-4">
            Recent Work
          </h2>
          <p className="text-lg lg:text-xl text-primary-foreground/80 max-w-3xl mx-auto">
            Explore our portfolio of completed projects throughout Milwaukee Metro.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg"
              data-testid={`img-gallery-${index}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-4">
                <span className="text-white font-heading font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {image.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-primary-foreground/80 text-lg">
            Follow us on{" "}
            <a
              href="https://www.facebook.com/profile.php?id=100092361378518"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-ring transition-colors"
              data-testid="link-facebook"
            >
              Facebook
            </a>{" "}
            for more photos and updates
          </p>
        </div>
      </div>
    </section>
  );
}
