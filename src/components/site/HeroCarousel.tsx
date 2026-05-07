import { Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type HeroCarouselProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  video_url?: string;
};

type HeroCarouselSlide = HeroCarouselProduct & {
  mediaSrc: string;
  mediaType: "image" | "video";
  slideId: string;
};

const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export function HeroCarousel() {
  const [products, setProducts] = useState<HeroCarouselProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    let isMounted = true;

    async function run() {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,description,image,video_url");

      if (!isMounted) return;

      if (error || !data) {
        setProducts([]);
        return;
      }

      setProducts(
        data
          .map((row: any) => ({
            id: typeof row?.id === "string" ? row.id : "",
            name: typeof row?.name === "string" ? row.name : "",
            slug: typeof row?.slug === "string" ? row.slug : "",
            description: typeof row?.description === "string" ? row.description : "",
            image: typeof row?.image === "string" ? row.image : "",
            video_url:
              typeof row?.video_url === "string" && row.video_url.length > 0 ? row.video_url : undefined,
          }))
          .filter((product) =>
            Boolean(product.id && product.name && product.slug && (product.image || product.video_url)),
          ),
      );
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  const slides: HeroCarouselSlide[] = useMemo(
    () =>
      products.flatMap((product) => {
        const productSlides: HeroCarouselSlide[] = [];

        if (product.image) {
          productSlides.push({
            ...product,
            mediaSrc: product.image,
            mediaType: "image",
            slideId: `${product.id}-image`,
          });
        }

        if (product.video_url) {
          productSlides.push({
            ...product,
            mediaSrc: product.video_url,
            mediaType: "video",
            slideId: `${product.id}-video`,
          });
        }

        return productSlides;
      }),
    [products],
  );

  const active = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (isPaused || slides.length <= 1 || active?.mediaType === "video") return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [active?.mediaType, isPaused, slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([slideId, video]) => {
      if (!video) return;

      if (slideId === active?.slideId) {
        video.currentTime = 0;
        void video.play().catch(() => undefined);
        return;
      }

      video.pause();
      video.currentTime = 0;
    });
  }, [active?.slideId]);

  if (!slides.length) return null;

  const showVideo = active.mediaType === "video";

  return (
    <section className="px-4 pt-6 md:px-6 md:pt-8">
      <div
        className="relative mx-auto h-[72vh] max-h-[820px] min-h-[560px] max-w-[1500px] overflow-hidden rounded-[2rem] border border-border/70 bg-background shadow-soft"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide, index) => {
          const activeSlide = index === activeIndex;

          return (
            <div
              key={slide.slideId}
              className={`absolute inset-0 cinematic ${activeSlide ? "opacity-100" : "opacity-0"}`}
            >
              {slide.mediaType === "video" && isDirectVideo(slide.mediaSrc) ? (
                <video
                  ref={(element) => {
                    videoRefs.current[slide.slideId] = element;
                  }}
                  src={slide.mediaSrc}
                  className="h-full w-full object-cover"
                  autoPlay={activeSlide}
                  muted
                  playsInline
                  preload={activeSlide || index === (activeIndex + 1) % slides.length ? "auto" : "metadata"}
                  onEnded={() => {
                    setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
                  }}
                />
              ) : slide.mediaType === "video" ? (
                <iframe
                  src={slide.mediaSrc}
                  title={`${slide.name} em vídeo`}
                  className="h-full w-full"
                  loading={activeSlide ? "eager" : "lazy"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <img
                  src={slide.mediaSrc}
                  alt={slide.name}
                  className="h-full w-full object-cover"
                  loading={activeSlide ? "eager" : "lazy"}
                />
              )}
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.86)_0%,rgba(5,5,5,0.46)_45%,rgba(5,5,5,0.18)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_25%_55%,rgba(255,170,40,0.16)_0%,transparent_65%)]" />

        <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end px-7 py-10 md:px-14 md:py-16">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/25 px-4 py-2 text-xs uppercase tracking-[0.26em] text-muted-foreground backdrop-blur glass">
            {showVideo ? <Play className="h-3.5 w-3.5 fill-primary text-primary" /> : null}
            Destaque JANGO3D
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] text-balance md:text-7xl">
            {active.name}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {active.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/personalizar"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Personalizar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/colecao"
              className="rounded-full border border-border/70 bg-background/25 px-6 py-3.5 text-sm font-medium backdrop-blur glass cinematic hover:-translate-y-0.5 hover:bg-card/60"
            >
              Ver coleção
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10 flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.slideId}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setIsPaused(true);
              }}
              className={`h-1.5 rounded-full cinematic ${
                index === activeIndex ? "w-10 bg-primary shadow-glow" : "w-5 bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Mostrar ${slide.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
