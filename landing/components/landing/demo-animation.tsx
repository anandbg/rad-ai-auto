"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";

export interface DemoScreenshot {
  id: string;
  imageSrc: string;
  title: string;
  marketingTitle: string; // Main headline for marketing panel
  marketingDescription: string; // Description explaining what the screen does
  marketingBenefit: string; // How it helps the user
  duration?: number; // Duration in milliseconds (default: 4000)
  zoomFocus?: { x: number; y: number }; // Optional zoom effect center point (percentages 0-100)
}

interface DemoAnimationProps {
  screenshots: DemoScreenshot[];
  autoPlay?: boolean;
  loop?: boolean;
  transitionDuration?: number; // Transition duration in milliseconds
}

export function DemoAnimation({
  screenshots,
  autoPlay = true,
  loop = true,
  transitionDuration = 4000,
}: DemoAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-advance screenshots
  useEffect(() => {
    if (!isVisible || !isPlaying || isHovered || screenshots.length === 0) return;

    const currentScreenshot = screenshots[currentIndex];
    if (!currentScreenshot) return;

    const duration = currentScreenshot.duration || transitionDuration;

    // Schedule next screenshot transition
    timeoutRef.current = setTimeout(() => {
      if (loop || currentIndex < screenshots.length - 1) {
        setCurrentIndex((prev) => (prev + 1) % screenshots.length);
      } else {
        setIsPlaying(false);
      }
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isPlaying, isVisible, isHovered, screenshots, loop, transitionDuration]);

  // Navigate to previous screenshot
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    setIsPlaying(true);
  };

  // Navigate to next screenshot
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    setIsPlaying(true);
  };

  // Go to specific screenshot
  const goToScreenshot = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  if (screenshots.length === 0) {
    return null;
  }

  const currentScreenshot = screenshots[currentIndex];

  return (
    <section
      ref={containerRef}
      className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32"
      aria-label="Product demonstration"
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-muted/20 via-background to-surface-muted" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="relative mx-auto max-w-2xl text-center mb-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand">
          <Sparkles className="h-4 w-4" />
          <span>Watch It In Action</span>
        </div>
        <h2 className="mb-4 text-5xl sm:text-6xl font-bold bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">
          See It In Action
        </h2>
        <p className="text-lg sm:text-xl text-foreground-secondary">
          Watch how easy it is to transform your radiology workflow
        </p>
      </div>

      <div
        className="relative mx-auto max-w-6xl rounded-3xl border-2 border-brand/20 bg-surface overflow-hidden shadow-2xl transition-all hover:shadow-2xl hover:-translate-y-1"
        style={{
          boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Split Layout: Screenshot (3/4) + Marketing Panel (1/4) */}
        <div className="flex flex-col lg:flex-row">
          {/* Screenshot Container - 3/4 width */}
          <div className="relative w-full lg:w-3/4 aspect-video lg:aspect-auto lg:h-[600px] bg-surface-muted">
            {screenshots.map((screenshot, index) => {
              const isActive = index === currentIndex;
              const zoomFocus = screenshot.zoomFocus || { x: 50, y: 50 };

              return (
                <div
                  key={screenshot.id}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    isActive ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
                  }`}
                  style={{
                    transformOrigin: `${zoomFocus.x}% ${zoomFocus.y}%`,
                    willChange: "transform, opacity",
                  }}
                >
                  <Image
                    src={screenshot.imageSrc}
                    alt={screenshot.title}
                    fill
                    className="object-contain"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 1024px) 100vw, 75vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full bg-surface-muted text-foreground-muted">
                            <div class="text-center p-8">
                              <p class="text-lg font-medium mb-2">${screenshot.title}</p>
                              <p class="text-sm">Screenshot coming soon</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-lg"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-lg"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}

            {/* Screenshot Indicators */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
              {screenshots.map((screenshot, index) => (
                <button
                  key={screenshot.id}
                  onClick={() => goToScreenshot(index)}
                  className={`h-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                    index === currentIndex
                      ? "w-8 bg-brand shadow-lg"
                      : "w-2 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to screenshot: ${screenshot.title}`}
                  aria-current={index === currentIndex ? "true" : "false"}
                />
              ))}
            </div>
          </div>

          {/* Marketing Panel - 1/4 width */}
          <div className="w-full lg:w-1/4 bg-gradient-to-br from-brand-muted/30 via-surface to-surface-muted border-t lg:border-t-0 lg:border-l border-brand/20 p-6 sm:p-8 flex flex-col justify-center">
            <div className="space-y-5 animate-fade-in max-w-full">
              {/* Header with step number */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light flex items-center justify-center border border-brand/20">
                  <span className="text-sm font-bold text-brand">{currentIndex + 1}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted whitespace-nowrap">
                  {currentScreenshot.title}
                </span>
              </div>

              {/* Marketing Title */}
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {currentScreenshot.marketingTitle}
              </h3>

              {/* Marketing Description */}
              <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed">
                {currentScreenshot.marketingDescription}
              </p>

              {/* Benefit Section */}
              <div className="pt-5 border-t border-border/40">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success-light flex items-center justify-center mt-0.5">
                    <ArrowRight className="h-4 w-4 text-success rotate-[-45deg]" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed flex-1 min-w-0">
                    {currentScreenshot.marketingBenefit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {isPlaying && screenshots.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-30">
            <div
              className="h-full bg-brand transition-all ease-linear"
              style={{
                width: `${((currentIndex + 1) / screenshots.length) * 100}%`,
                transitionDuration: `${currentScreenshot.duration || transitionDuration}ms`,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
