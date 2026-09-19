import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Base wrapper: 24 grid, stroke follows currentColor, size comes from a class */
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </Icon>
  );
}

export function QueueIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h10M4 12h16M4 18h7" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="16" cy="18" r="2" />
    </Icon>
  );
}

export function PayoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5v19" />
      <path d="M16.5 6.5c-.8-1.4-2.5-2-4.5-2-2.5 0-4.2 1.2-4.2 3s1.6 2.6 4.2 3.2c2.9.7 4.8 1.5 4.8 3.6s-2 3.2-4.8 3.2c-2.2 0-4-.7-4.8-2.2" />
    </Icon>
  );
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="12" width="3.2" height="6" rx="1" />
      <rect x="10.4" y="7" width="3.2" height="11" rx="1" />
      <rect x="15.8" y="10" width="3.2" height="8" rx="1" />
    </Icon>
  );
}

export function CreateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.5v15M4.5 12h15" />
      <circle cx="12" cy="12" r="9" opacity={0.35} />
    </Icon>
  );
}

export function FlowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M7 11 17 6.8M7 13l10 4.2" />
    </Icon>
  );
}

export function DocsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.5h9l5 5V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M13.5 4.5v5h5" />
      <path d="M8 14h7M8 17h5" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 4h-2A1.5 1.5 0 0 0 4 5.6c.3 4 2 7.6 4.8 10.4 2.8 2.8 6.4 4.5 10.4 4.8a1.5 1.5 0 0 0 1.6-1.5v-2a1.5 1.5 0 0 0-1.2-1.5l-2.3-.5a1.5 1.5 0 0 0-1.5.6l-.8 1a12.4 12.4 0 0 1-5.4-5.4l1-.8a1.5 1.5 0 0 0 .6-1.5l-.5-2.3A1.5 1.5 0 0 0 9.2 4Z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m14.5 5-6 7 6 7" />
    </Icon>
  );
}

/** Doubled chevron, the one the sidebar collapse button carries */
export function ChevronsLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m11 5-6 7 6 7M18 5l-6 7 6 7" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 5 6 7-6 7" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.38a9.86 9.86 0 0 0 4.69 1.19h.01c5.45 0 9.89-4.44 9.9-9.9a9.82 9.82 0 0 0-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 1.83c2.16 0 4.19.84 5.72 2.37a8.03 8.03 0 0 1 2.37 5.72c0 4.46-3.63 8.08-8.09 8.08a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.03-.2-.31a8.04 8.04 0 0 1-1.23-4.3c0-4.45 3.63-8.08 8.18-8.02Zm-3.6 4.2c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.42 1.03 2.59.13.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.2-.58.2-1.08.15-1.19-.06-.1-.23-.16-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.79.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.12.25-.29.37-.44.13-.15.17-.25.25-.42.09-.17.04-.31-.02-.44-.06-.12-.55-1.36-.76-1.86-.2-.48-.4-.42-.55-.42h-.47Z" />
    </svg>
  );
}
