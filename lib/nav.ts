import type { ComponentType, SVGProps } from "react";
import {
  AnalyticsIcon,
  CreateIcon,
  DocsIcon,
  FlowIcon,
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

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/launch", label: "Launch", icon: CreateIcon },
  { href: "/tokens", label: "Tokens", icon: QueueIcon },
  { href: "/queue", label: "Calls", icon: PhoneIcon },
  { href: "/payouts", label: "Payouts", icon: PayoutIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/flow", label: "Flow", icon: FlowIcon },
  { href: "/docs", label: "Docs", icon: DocsIcon },
];

export const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "/launch", label: "Launch" },
      { href: "/tokens", label: "Tokens" },
      { href: "/queue", label: "Calls" },
      { href: "/payouts", label: "Payouts" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { href: "/analytics", label: "Analytics" },
      { href: "/flow", label: "Flow" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/opt-out", label: "Consent" },
    ],
  },
];
