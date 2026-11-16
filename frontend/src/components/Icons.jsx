const ICON_PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 7.5h18v3a2 2 0 0 0 0 4v2.5H3v-2.5a2 2 0 0 0 0-4v-3z" />
      <path d="M9 7.5v9" strokeDasharray="2 2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 21c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3 20c.6-3.2 2.9-5 6-5s5.4 1.8 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 6" />
      <path d="M18 15.2c1.8.6 2.8 2.2 3 4.8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-4" />
      <path d="M12.5 16V7" />
      <path d="M17 16v-7" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5v16h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16l-6.2 7.2V20l-3.6-2v-5.8z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: (
    <>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12.2 2.6 2.6 5.4-5.6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4z" />
      <path d="M12 9v5" />
      <path d="M12 17.3v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 7.8v.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.2 2.8 7.6 7 9.5 4.2-1.9 7-5.3 7-9.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 20h14" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 9h16.4M3.8 15h16.4" />
      <path d="M12 3.5c2.2 2.3 3.2 5.2 3.2 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.2-5.2-3.2-8.5S9.8 5.8 12 3.5z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="m14 7 3 3" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4L3 10" />
      <path d="M3 5v5h5" />
      <path d="M4 13a8 8 0 0 0 14 4l3-3" />
      <path d="M21 19v-5h-5" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12.5V4h8.5L20 11.5 12.5 19z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9.5h17" />
    </>
  ),
  building: (
    <>
      <path d="M5 21V5h9v16" />
      <path d="M14 9h5v12" />
      <path d="M8 9h3M8 13h3M8 17h3M17 13h.1M17 17h.1" />
      <path d="M3 21h18" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13a8 8 0 1 1 16 0" />
      <path d="M4 13h2.5v6H5a1.5 1.5 0 0 1-1.5-1.5V13z" />
      <path d="M20 13h-2.5v6H19a1.5 1.5 0 0 0 1.5-1.5V13z" />
      <path d="M17.5 19v.5a2.5 2.5 0 0 1-2.5 2.5h-2" />
    </>
  ),
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  sparkles: (
    <>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  wifi: (
    <>
      <path d="M3 9a14 14 0 0 1 18 0" />
      <path d="M6 12.5a9.5 9.5 0 0 1 12 0" />
      <path d="M9 16a5 5 0 0 1 6 0" />
      <path d="M12 19.5h.1" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </>
  ),
};

export function Icon({ name, size = 18, className = '', strokeWidth = 1.8 }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name] || ICON_PATHS.info}
    </svg>
  );
}
