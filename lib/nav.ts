import type { ComponentType, SVGProps } from "react";
import {
  CreateIcon,
  HomeIcon,
  PayoutIcon,
  PhoneIcon,
  QueueIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Five sections, each answering a different question: what is this, how do I
 * start, what exists, when do I get called, did I get paid
 *
 * Docs, consent and the legal pages are real but sit in the footer, they are
 * not places you visit while using the service
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/launch", label: "Launch", icon: CreateIcon },
  { href: "/tokens", label: "Tokens", icon: QueueIcon },
  { href: "/queue", label: "Calls", icon: PhoneIcon },
  { href: "/payouts", label: "Payouts", icon: PayoutIcon },
];

export const FOOTER_LINKS = [
  { href: "/docs", label: "How it works" },
  { href: "/opt-out", label: "Stop calls" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];
