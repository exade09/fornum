import Image from "next/image";
import logo from "@/public/logo.png";
import { cn } from "@/lib/cn";

/**
 * The project mark. Static import, so Next knows the intrinsic size and can
 * serve the right one per density without a layout shift
 *
 * The artwork carries its own black plate, so it is rounded rather than left
 * as a hard square against the page
 */
export function Brand({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={logo}
      alt=""
      width={size}
      height={size}
      priority
      className={cn("shrink-0 rounded-[7px] ring-1 ring-primary/10", className)}
    />
  );
}
