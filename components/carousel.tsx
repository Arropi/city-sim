"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Interface data untuk setiap item card di dalam Carousel.
 * Bersifat fleksibel dan strongly-typed tanpa menggunakan `any`.
 */
export interface CarouselCardItem {
  id: string | number;
  title: string;
  subtitle?: string;
  image: string;
  imageAlt?: string;
  imageAspectRatio?: string;
  href?: string;
  onActionClick?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  rtlhPercentage: number | string;
  rtlhLabel?: string;
  density: number | string;
  densityLabel?: string;
  badge?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

/**
 * Props untuk komponen CarouselCard bawaan.
 */
export interface CarouselCardProps<T extends CarouselCardItem = CarouselCardItem> {
  item: T;
  isActive?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  imageAspectRatio?: string;
  renderAction?: (item: T) => React.ReactNode;
  onClick?: () => void;
}

/**
 * Komponen Card individual dengan optimasi React.memo.
 * Menggunakan @/components/ui/card.tsx sesuai spesifikasi pengguna.
 */
export const CarouselCard = React.memo(function CarouselCard<
  T extends CarouselCardItem = CarouselCardItem
>({
  item,
  isActive = false,
  className,
  activeClassName,
  inactiveClassName,
  imageAspectRatio = "aspect-[3/1]",
  renderAction,
  onClick,
}: CarouselCardProps<T>) {
  // Format tampilan persentase RTLH
  const formattedRtlh = React.useMemo(() => {
    if (typeof item.rtlhPercentage === "number") {
      return `${item.rtlhPercentage}%`;
    }
    return item.rtlhPercentage.includes("%")
      ? item.rtlhPercentage
      : `${item.rtlhPercentage}%`;
  }, [item.rtlhPercentage]);

  // Format tampilan kepadatan
  const formattedDensity = React.useMemo(() => {
    if (typeof item.density === "number") {
      return `${item.density}k jiwa`;
    }
    return item.density;
  }, [item.density]);

  return (
    <Card
      onClick={onClick}
      style={{ backgroundColor: "#ffffff" }}
      className={cn(
        "group/carousel-card w-full select-none overflow-hidden transition-all duration-300 ease-out bg-white border-none box-shadow-custom box-shadow-color-[#000000]/45 p-0 transform-gpu",
        isActive
          ? cn("scale-105 shadow-xl z-20 ", activeClassName)
          : cn("scale-[0.88] shadow-sm hover:scale-[0.91] z-10 cursor-pointer", inactiveClassName),
        className,
        item.className
      )}
    >
      {/* Gambar atas dengan padding dan rounded 8px */}
      <div className="p-3 pb-0">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-[8px] bg-neutral-100",
            item.imageAspectRatio ?? imageAspectRatio
          )}
        >
          <Image
            src={item.image}
            alt={item.imageAlt ?? item.title}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover rounded-[8px] transition-transform duration-500 group-hover/carousel-card:scale-105"
            unoptimized={item.image.startsWith("http") || item.image.startsWith("data:")}
          />
          {item.badge && (
            <div className="absolute top-2 left-2 z-10">
              {typeof item.badge === "string" ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900/70 text-white backdrop-blur-xs">
                  {item.badge}
                </span>
              ) : (
                item.badge
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header card dengan title, subtitle, dan action button di ujung kanan */}
      <CardHeader className="px-3.5 pt-2 pb-1.5">
        <CardTitle className="text-body-1 font-bold text-neutral-900 line-clamp-1">
          {item.title}
        </CardTitle>
        {item.subtitle && (
          <CardDescription className="text-body-3 text-neutral-600 line-clamp-1">
            {item.subtitle}
          </CardDescription>
        )}

        {/* Action Button untuk direct ke halaman target */}
        <CardAction>
          {renderAction ? (
            renderAction(item)
          ) : item.href ? (
            <Link
              href={item.href}
              aria-label={item.actionLabel ?? `Buka detail ${item.title}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              )}
            >
              {item.actionIcon ?? <ArrowRight className="size-4" />}
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              onClick={item.onActionClick}
              aria-label={item.actionLabel ?? `Aksi ${item.title}`}
            >
              {item.actionIcon ?? <ArrowRight className="size-4" />}
            </Button>
          )}
        </CardAction>
      </CardHeader>

      {/* Bagian bawah card (CardContent): div justify-between berisi RTLH dan Kepadatan */}
      <CardContent className="px-3.5 pb-3">
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-neutral-100">
          {/* Item 1: RTLH */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Icon home.svg tepat di tengah dari ukuran 2-line keterangan */}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#34C7591A]">
              <Image
                src="/icons/home.svg"
                alt="Rumah Tidak Layak Huni"
                width={16}
                height={16}
                className="size-4 object-contain"
              />
            </div>
            {/* Keterangan flex column yang vertikal center terhadap icon */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-body-4 font-medium text-neutral-600 truncate leading-tight">
                {item.rtlhLabel ?? "Rumah Tidak Layak Huni"}
              </span>
              <span className="text-body-2 font-bold text-neutral-900 leading-tight">
                {formattedRtlh}
              </span>
            </div>
          </div>

          {/* Item 2: Kepadatan */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Icon people-grup.svg tepat di tengah dari ukuran 2-line keterangan */}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0088FF1A]">
              <Image
                src="/icons/people-grup.svg"
                alt="Kepadatan"
                width={16}
                height={16}
                className="size-4 object-contain"
              />
            </div>
            {/* Keterangan flex column yang vertikal center terhadap icon */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-body-4 font-medium text-neutral-600 truncate leading-tight">
                {item.densityLabel ?? "Kepadatan"}
              </span>
              <span className="text-body-2 font-bold text-neutral-900 leading-tight">
                {formattedDensity}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}) as <T extends CarouselCardItem = CarouselCardItem>(
  props: CarouselCardProps<T>
) => React.ReactElement;

/**
 * Props untuk komponen Carousel utama.
 */
export interface CarouselProps<T extends CarouselCardItem = CarouselCardItem> {
  items: T[];
  initialIndex?: number;
  cardWidth?: number;
  gap?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
  className?: string;
  trackClassName?: string;
  cardClassName?: string;
  activeCardClassName?: string;
  inactiveCardClassName?: string;
  imageAspectRatio?: string;
  showNavigation?: boolean;
  showIndicators?: boolean;
  visibleCards?: number;
  renderItem?: (item: T, index: number, isActive: boolean) => React.ReactNode;
  renderPrevButton?: (props: { onClick: () => void; disabled?: boolean }) => React.ReactNode;
  renderNextButton?: (props: { onClick: () => void; disabled?: boolean }) => React.ReactNode;
  renderIndicators?: (props: {
    activeIndex: number;
    total: number;
    goToIndex: (index: number) => void;
  }) => React.ReactNode;
  onSlideChange?: (activeIndex: number, item: T) => void;
}

/**
 * Komponen Carousel Infinite Loop dengan optimasi tinggi:
 * - Dukungan infinite swipe / drag dan loop button navigasi.
 * - Ukuran card aktif lebih besar dari card lainnya.
 * - Navigasi kiri dan kanan yang dapat dikustomisasi.
 * - List isi komponen dapat dikustomisasi melalui `renderItem` atau data generic.
 * - React.memo, useCallback, dan useMemo untuk pencegahan rerender yang berlebihan.
 */
export function Carousel<T extends CarouselCardItem = CarouselCardItem>({
  items,
  initialIndex = 0,
  cardWidth,
  gap = 16,
  autoPlay = false,
  autoPlayInterval = 4000,
  pauseOnHover = true,
  className,
  trackClassName,
  cardClassName,
  activeCardClassName,
  inactiveCardClassName,
  imageAspectRatio = "aspect-[3/1]",
  showNavigation = true,
  showIndicators = true,
  visibleCards,
  renderItem,
  renderPrevButton,
  renderNextButton,
  renderIndicators,
  onSlideChange,
}: CarouselProps<T>) {
  const total = items.length;

  // Normalisasi index aktif saat ini (0 .. total - 1)
  const [activeIndex, setActiveIndex] = React.useState<number>(() => {
    if (total === 0) return 0;
    return Math.max(0, Math.min(initialIndex, total - 1));
  });

  // Track virtual offset untuk infinite loop smooth sliding (menggunakan 5 set, fokus awal di set tengah)
  const [virtualIndex, setVirtualIndex] = React.useState<number>(() => {
    if (total <= 1) return 0;
    return 2 * total + (initialIndex % total);
  });

  const [isTransitioning, setIsTransitioning] = React.useState<boolean>(true);
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  // Dragging state
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const dragStartXRef = React.useRef<number>(0);
  const isDraggingRef = React.useRef<boolean>(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Responsiveness: deteksi ukuran container
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Deteksi apakah sedang di ukuran desktop (breakpoint desktop: containerWidth >= 860 atau window.innerWidth >= 1024)
  const isDesktop = React.useMemo(() => {
    if (containerWidth >= 860) return true;
    if (containerWidth === 0 && typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  }, [containerWidth]);

  // Hitung lebar card aktual: pada desktop tepat 1/3 lebar container (minus gaps) sehingga menampilkan tepat 3 card
  const calculatedCardWidth = React.useMemo(() => {
    const targetCards = visibleCards ?? 3;

    // Estimasi awal sebelum ResizeObserver mengukur container
    if (containerWidth === 0) {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        const estimatedContainer = window.innerWidth - 96;
        const totalEstimatedGaps = (targetCards - 1) * gap;
        return Math.floor((estimatedContainer - totalEstimatedGaps) / targetCards);
      }
      return cardWidth ?? 320;
    }

    // Pada desktop atau layar >= 640px: lebar card dibuat untuk tepat targetCards (default 3) card
    if (isDesktop || containerWidth >= 640) {
      const totalGaps = (targetCards - 1) * gap;
      const availableWidth = Math.max(0, containerWidth - totalGaps);
      const computedWidth = Math.floor(availableWidth / targetCards);
      if (cardWidth) {
        return Math.min(cardWidth, computedWidth);
      }
      return computedWidth;
    }

    // Mobile (< 640px): Card aktif dominan di tengah dengan sisi kiri dan kanan mengintip
    const mobileWidth = Math.max(240, Math.min(containerWidth - 48, 340));
    if (cardWidth) {
      return Math.min(cardWidth, mobileWidth);
    }
    return mobileWidth;
  }, [cardWidth, containerWidth, gap, isDesktop, visibleCards]);

  const [prevTotal, setPrevTotal] = React.useState<number>(total);

  // Handle jika items berubah secara dinamis tanpa memicu cascading setState dalam useEffect
  if (prevTotal !== total) {
    setPrevTotal(total);
    if (total === 0) {
      setActiveIndex(0);
      setVirtualIndex(0);
    } else {
      if (activeIndex >= total) {
        setActiveIndex(0);
      }
      if (total <= 1) {
        setVirtualIndex(0);
      } else {
        const normalized = ((virtualIndex % total) + total) % total;
        setVirtualIndex(2 * total + normalized);
      }
    }
  }

  // Callback saat activeIndex berubah
  React.useEffect(() => {
    if (total > 0 && items[activeIndex]) {
      onSlideChange?.(activeIndex, items[activeIndex]);
    }
  }, [activeIndex, items, onSlideChange, total]);

  // Navigasi ke slide selanjutnya
  const handleNext = React.useCallback(() => {
    if (total <= 1) return;
    setIsTransitioning(true);
    setVirtualIndex((prev) => prev + 1);
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Navigasi ke slide sebelumnya
  const handlePrev = React.useCallback(() => {
    if (total <= 1) return;
    setIsTransitioning(true);
    setVirtualIndex((prev) => prev - 1);
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Navigasi ke index tertentu
  const goToIndex = React.useCallback(
    (index: number) => {
      if (total <= 1) return;
      const target = Math.max(0, Math.min(index, total - 1));
      const currentActive = ((virtualIndex % total) + total) % total;
      let diff = target - currentActive;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      setIsTransitioning(true);
      setVirtualIndex((prev) => prev + diff);
      setActiveIndex(target);
    },
    [total, virtualIndex]
  );

  // Normalisasi infinite virtualIndex setelah animasi transisi selesai
  const handleTransitionEnd = React.useCallback(() => {
    if (total <= 1) return;

    // Jika virtualIndex melampaui batas kanan set tengah (>= 3 * total)
    if (virtualIndex >= 3 * total) {
      setIsTransitioning(false);
      const normalized = 2 * total + (virtualIndex % total);
      setVirtualIndex(normalized);
    }
    // Jika virtualIndex melampaui batas kiri set tengah (< 2 * total)
    else if (virtualIndex < 2 * total) {
      setIsTransitioning(false);
      const normalized = 2 * total + (((virtualIndex % total) + total) % total);
      setVirtualIndex(normalized);
    }
  }, [total, virtualIndex]);

  // Autoplay handler
  React.useEffect(() => {
    if (!autoPlay || total <= 1 || (pauseOnHover && isHovered) || isDragging) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, handleNext, isDragging, isHovered, pauseOnHover, total]);

  // Drag & Swipe Event Handlers
  const handleDragStart = React.useCallback(
    (clientX: number) => {
      if (total <= 1) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartXRef.current = clientX;
      setDragOffset(0);
    },
    [total]
  );

  const handleDragMove = React.useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const delta = clientX - dragStartXRef.current;
    setDragOffset(delta);
  }, []);

  const handleDragEnd = React.useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const threshold = 50; // minimum drag distance in px
    if (dragOffset < -threshold) {
      handleNext();
    } else if (dragOffset > threshold) {
      handlePrev();
    }
    setDragOffset(0);
  }, [dragOffset, handleNext, handlePrev]);

  // Cleanup timeout transisi
  React.useEffect(() => {
    const timeout = transitionTimeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // Cloned items untuk infinite rendering (5 set: total * 5)
  const displayItems = React.useMemo(() => {
    if (total === 0) return [];
    if (total === 1) {
      return [{ item: items[0], originalIndex: 0, key: `item-${items[0].id}-single` }];
    }
    // Buat 5 set: [set 0, set 1, set 2 (tengah/fokus), set 3, set 4]
    const result: Array<{ item: T; originalIndex: number; key: string }> = [];
    for (let set = 0; set < 5; set++) {
      for (let i = 0; i < total; i++) {
        result.push({
          item: items[i],
          originalIndex: i,
          key: `item-${items[i].id}-set-${set}-${i}`,
        });
      }
    }
    return result;
  }, [items, total]);

  // Perhitungan offset center track agar card aktif selalu tepat di tengah horizontal
  const trackTranslateX = React.useMemo(() => {
    if (containerWidth === 0) return 0;
    const itemFullWidth = calculatedCardWidth + gap;
    const centerOffset = (containerWidth - calculatedCardWidth) / 2;
    const baseOffset = centerOffset - virtualIndex * itemFullWidth;
    return baseOffset + dragOffset;
  }, [calculatedCardWidth, containerWidth, dragOffset, gap, virtualIndex]);

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={cn("relative z-10 w-full py-1 select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (isDraggingRef.current) {
          handleDragEnd();
        }
      }}
      // Mouse drag handlers
      onMouseDown={(e) => {
        // Hanya tangkap klik kiri mouse
        if (e.button === 0) {
          handleDragStart(e.clientX);
        }
      }}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      // Touch swipe handlers
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleDragStart(e.touches[0].clientX);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          handleDragMove(e.touches[0].clientX);
        }
      }}
      onTouchEnd={handleDragEnd}
      onTouchCancel={handleDragEnd}
    >
      {/* Viewport Card yang menjorok ke dalam */}
      <div
        ref={containerRef}
        className={cn("overflow-hidden mx-8 sm:mx-12 py-4 sm:py-5", trackClassName)}
      >
        {/* Sliding Track */}
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(${trackTranslateX}px)`,
            transition: isTransitioning && !isDragging ? "transform 350ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
          }}
          className="flex items-center cursor-grab active:cursor-grabbing will-change-transform"
        >
          {displayItems.map((entry, vIndex) => {
            const isItemActive = total === 1 ? true : vIndex === virtualIndex;

            return (
              <div
                key={entry.key}
                style={{
                  width: `${calculatedCardWidth}px`,
                  marginRight: `${gap}px`,
                  flexShrink: 0,
                }}
                className={cn(
                  "transition-all duration-300 flex items-center justify-center origin-center",
                  isItemActive ? "z-20" : "z-10"
                )}
                onClick={() => {
                  // Jika user mengklik card yang bukan active, jadikan card tersebut center dan aktif
                  if (!isItemActive && total > 1) {
                    setIsTransitioning(true);
                    setVirtualIndex(vIndex);
                    setActiveIndex(entry.originalIndex);
                  }
                }}
              >
                {renderItem ? (
                  renderItem(entry.item, entry.originalIndex, isItemActive)
                ) : (
                  <CarouselCard
                    item={entry.item}
                    isActive={isItemActive}
                    imageAspectRatio={imageAspectRatio}
                    className={cardClassName}
                    activeClassName={activeCardClassName}
                    inactiveClassName={inactiveCardClassName}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigasi Kiri & Kanan yang dapat di-custom */}
      {showNavigation && total > 1 && (
        <div className="pointer-events-none absolute inset-y-0 inset-x-0.5 sm:inset-x-1 flex items-center justify-between z-30">
          <div className="pointer-events-auto">
            {renderPrevButton ? (
              renderPrevButton({ onClick: handlePrev, disabled: false })
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="size-8 sm:size-9 rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-xs hover:bg-white hover:text-neutral-950 border-neutral-200 transition-all active:scale-95"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="size-4 sm:size-5" />
              </Button>
            )}
          </div>

          <div className="pointer-events-auto">
            {renderNextButton ? (
              renderNextButton({ onClick: handleNext, disabled: false })
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="size-8 sm:size-9 rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-xs hover:bg-white hover:text-neutral-950 border-neutral-200 transition-all active:scale-95"
                aria-label="Slide selanjutnya"
              >
                <ChevronRight className="size-4 sm:size-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Indicators / Pagination Dots */}
      {showIndicators && total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5 z-20">
          {renderIndicators ? (
            renderIndicators({
              activeIndex,
              total,
              goToIndex,
            })
          ) : (
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-100/80 backdrop-blur-xs">
              {Array.from({ length: total }).map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToIndex(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      isActive
                        ? "w-6 bg-primary-400"
                        : "w-2 bg-neutral-300 hover:bg-neutral-400"
                    )}
                    aria-label={`Menuju slide ke-${idx + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Carousel;
