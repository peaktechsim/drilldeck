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
        d="M3 9H15.5L19.8 7.6C20.5 7.4 21 7.9 21 8.6V11.1C21 11.7 20.6 12.2 20 12.4L18.4 12.9V16C18.4 16.6 17.9 17 17.3 17H15.6L14.2 21H11.8L12.4 17H9.4L8.1 20.6H5.9L6.6 17H5.8C4.8 17 4 16.2 4 15.2V12.8H3V9ZM7.1 12.4V15H9.4L10.2 12.4H7.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RifleIcon({ className, ...props }: WeaponIconProps) {
  return (
    <svg
      viewBox="0 0 40 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1 11H6.8V8.9H9V7.8H10V8.9H14.3L18.2 6.2H24.7V4H27.2V6.2H30.8V7.3H32.9V10.1H37.2V11.2H39V12.8H37.2V13.9H32.6L31.2 16H28.2L29 13.9H26.4V18H23.8L22.3 22H19.5L20 18H17.2L15.8 13.9H11.8L10.1 17.7H8.1L8.6 13.9H1V11ZM24.3 8.4H21.9L18.9 10.6V11.8H24.3V8.4Z"
        fill="currentColor"
      />
    </svg>
  );
}
