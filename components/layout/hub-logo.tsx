/** Neutral, configurable Hub mark (a stylised leaf). Not a MongoDB trademark asset. */
export function HubLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#023430" />
      <path d="M16 5c3.8 4.2 6 8.4 6 12.4 0 3.6-2.4 6.4-5.3 7.2V28h-1.4v-3.4C12.4 23.8 10 21 10 17.4 10 13.4 12.2 9.2 16 5Z" fill="#00ED64" />
      <path d="M16 9.5v15" stroke="#023430" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
