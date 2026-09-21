import type { ComponentType, SVGProps } from "react";
import {
  CreateIcon,
  DocsIcon,
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
 * What this is, how to start, what exists, what was paid out, and how it works
 *
 * Docs sits last because it is read once and the four above are returned to.
 * The legal pages stay in the footer, they are not places you visit while
 * using the service
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/launch", label: "Launch", icon: CreateIcon },
  { href: "/tokens", label: "Tokens", icon: QueueIcon },
  { href: "/payouts", label: "Claims", icon: PayoutIcon },
  { href: "/docs", label: "Docs", icon: DocsIcon },
];

// docs moved into the column above, so linking it here as well would be the
// same destination twice
export const FOOTER_LINKS = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];
