import { Gallery6 } from "@/components/blocks/gallery6"

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  address?: string;
  symbol?: string;
  uri?: string;
  metadata?: any;
}

interface CarouselProps {
  heading: string;
  demoUrl: string;
  items: GalleryItem[];
  showListButton?: boolean;
}

const defaultCarouselData = {
  heading: "Featured Projects",
  demoUrl: "https://www.shadcnblocks.com",
  items: [
    {
      id: "item-1",
      title: "Build Modern UIs",
      summary:
        "Create stunning user interfaces with our comprehensive design system.",
      url: "#",
      image: "https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg",
    },
    {
      id: "item-2",
      title: "Design System Components",
      summary:
        "Explore our library of customizable components built with shadcn/ui and Tailwind CSS.",
      url: "#",
      image: "https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg",
    },
    {
      id: "item-3",
      title: "Responsive Layouts",
      summary:
        "Build websites that look great on any device with our responsive design patterns.",
      url: "#",
      image: "https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg",
    },
    {
      id: "item-4",
      title: "Developer Experience",
      summary:
        "Streamline your workflow with our developer-friendly tools and documentation.",
      url: "#",
      image: "https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg",
    },
    {
      id: "item-5",
      title: "Performance First",
      summary:
        "Create fast, optimized websites using our performance-focused components.",
      url: "#",
      image: "https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg",
    },
  ],
};

function Carousel({ 
  heading = defaultCarouselData.heading, 
  demoUrl = defaultCarouselData.demoUrl, 
  items = defaultCarouselData.items,
  showListButton = false
}: Partial<CarouselProps>) {
  return <Gallery6 
    heading={heading} 
    demoUrl={demoUrl} 
    items={items} 
    showListButton={showListButton}
  />;
}

export { Carousel };
