import type { ComponentType, SVGProps } from "react";
import {
  AnalyticsIcon,
  CreateIcon,
  DocsIcon,
  FlowIcon,
  HomeIcon,
  PayoutIcon,
  QueueIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/queue", label: "Queue", icon: QueueIcon },
  { href: "/payouts", label: "Payouts", icon: PayoutIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/create", label: "Create", icon: CreateIcon },
  { href: "/flow", label: "Flow", icon: FlowIcon },
  { href: "/docs", label: "Docs", icon: DocsIcon },
];

export const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "/queue", label: "Queue" },
      { href: "/payouts", label: "Payouts" },
      { href: "/analytics", label: "Analytics" },
      { href: "/create", label: "Create" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { href: "/flow", label: "Flow" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/opt-out", label: "Opt out" },
    ],
  },
];
