import type { SVGProps } from "react";

type WeaponIconProps = SVGProps<SVGSVGElement>;

export function PistolIcon({ className, ...props }: WeaponIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4 9.5H14.5L19.5 7.5V11L17.8 11.8V14.5C17.8 15.3 17.2 16 16.4 16H14.4L13.1 20H10.5L11.2 16H7.4C6 16 5 15 5 13.6V12H4V9.5Z"
        fill="currentColor"
      />
      <path
        d="M14.3 9.5V7.4C14.3 6.9 14.7 6.5 15.2 6.5H17.4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 12.1H11.8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RifleIcon({ className, ...props }: WeaponIconProps) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.5 11H9.5L12.2 8.8H18.4V7H21.2V8.8H25.2L29.5 10.2V11.8L25.2 13.2H23.2L21.5 15.5H18.7L19.6 13.2H15L11.1 16.8H8.2L10.6 13.2H2.5V11Z"
        fill="currentColor"
      />
      <path
        d="M5 11V9.4H8.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.6 8.8V6.6H26.8V8.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29.5 11.7H31"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
