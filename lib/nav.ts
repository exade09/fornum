import type { ComponentType, SVGProps } from "react";
import {
  CreateIcon,
  HomeIcon,
  PayoutIcon,
  QueueIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Four sections. What this is, how to start, what exists, what was paid out
 *
 * Docs and the legal pages are real but sit in the footer, they are not places
 * you visit while using the service
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/launch", label: "Launch", icon: CreateIcon },
  { href: "/tokens", label: "Tokens", icon: QueueIcon },
  { href: "/payouts", label: "Claims", icon: PayoutIcon },
];

export const FOOTER_LINKS = [
  { href: "/docs", label: "How it works" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];
