import type { SVGProps } from "react";

/* Lucide-style line icons, 24px grid, currentColor. Trimmed to what the app uses. */

type P = SVGProps<SVGSVGElement> & { strokeWidth?: number };

function Icon({ children, strokeWidth = 1.75, ...props }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Icon>
);

export const IconWallet = (p: P) => (
  <Icon {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h13v4" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
    <path d="M21 9v6h-5a3 3 0 0 1 0-6h5Z" />
  </Icon>
);

export const IconBox = (p: P) => (
  <Icon {...p}>
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 12v9.5" />
    <path d="M20.5 7.5v9L12 21.5 3.5 16.5v-9L12 2.5l8.5 5Z" />
  </Icon>
);

export const IconReceipt = (p: P) => (
  <Icon {...p}>
    <path d="M5 3v18l2-1.2L9 21l3-1.8L15 21l2-1.2L19 21V3l-2 1.2L15 3l-3 1.8L9 3 7 4.2 5 3Z" />
    <path d="M9 8h6M9 12h6" />
  </Icon>
);

export const IconClipboard = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4a3 3 0 0 1 6 0" />
    <path d="M9 11h6M9 15h4" />
  </Icon>
);

export const IconUsers = (p: P) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5" />
    <path d="M16 5.2A3 3 0 0 1 16 11" />
    <path d="M18 15c2 .5 3.4 2.2 3.8 4.8" />
  </Icon>
);

export const IconChart = (p: P) => (
  <Icon {...p}>
    <path d="M4 4v16h16" />
    <path d="M8 15l3-4 3 2 4-6" />
  </Icon>
);

export const IconPlus = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconChevronRight = (p: P) => (
  <Icon {...p}>
    <path d="m9 5 7 7-7 7" />
  </Icon>
);

export const IconChevronLeft = (p: P) => (
  <Icon {...p}>
    <path d="m15 5-7 7 7 7" />
  </Icon>
);

export const IconArrowDownLeft = (p: P) => (
  <Icon {...p}>
    <path d="M17 7 7 17" />
    <path d="M8 8v9h9" transform="rotate(90 12 12)" />
  </Icon>
);

export const IconArrowUp = (p: P) => (
  <Icon {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Icon>
);

export const IconArrowDown = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </Icon>
);

export const IconCheck = (p: P) => (
  <Icon {...p}>
    <path d="m4 12 5 5L20 6" />
  </Icon>
);

export const IconShare = (p: P) => (
  <Icon {...p}>
    <path d="M12 3v13" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Icon>
);

export const IconDownload = (p: P) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </Icon>
);

export const IconTrash = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

export const IconEdit = (p: P) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m14 6 4 4" />
  </Icon>
);

export const IconLogout = (p: P) => (
  <Icon {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 16 4 12l6-4" />
    <path d="M4 12h12" />
  </Icon>
);

export const IconCamera = (p: P) => (
  <Icon {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-2h6.6L18.5 6H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z" transform="translate(-1)" />
    <circle cx="11" cy="13" r="3.4" />
  </Icon>
);

export const IconSpark = (p: P) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
  </Icon>
);

export const IconAlert = (p: P) => (
  <Icon {...p}>
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4M12 17.5v.5" />
  </Icon>
);

export const IconClock = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.2 2" />
  </Icon>
);

export const IconTag = (p: P) => (
  <Icon {...p}>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.6" />
  </Icon>
);

export const IconSettings = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </Icon>
);
