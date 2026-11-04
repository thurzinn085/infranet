"use client";

export default function AuthIllustration({ signupMode }: { signupMode: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 270"
      fill="none"
      className="auth-illustration h-auto w-full max-w-[470px]"
    >
      <path d="M47 227h386" stroke="#101010" strokeOpacity=".22" />
      <rect x="74" y="52" width="332" height="128" rx="12" fill="#101010" />
      <rect x="88" y="66" width="304" height="100" rx="6" stroke="#C8FF00" strokeOpacity=".7" />
      <path d="M100 92h280M100 141h280" stroke="#C8FF00" strokeOpacity=".26" />

      {Array.from({ length: 12 }, (_, index) => {
        const x = 106 + index * 23;
        const ledOn = signupMode ? index % 4 === 1 || index % 4 === 2 : index % 4 === 0 || index % 4 === 3;
        return (
          <g key={index}>
            <rect x={x} y="104" width="14" height="25" rx="3" stroke="#C8FF00" strokeOpacity=".74" />
            <circle
              cx={x + 7}
              cy="117"
              r="2.4"
              fill={ledOn ? "#C8FF00" : "#101010"}
              className={ledOn ? "auth-led-on" : undefined}
            />
          </g>
        );
      })}

      <path
        d={signupMode ? "M128 180v27c0 12 10 22 22 22h180c14 0 25-11 25-25v-24" : "M128 180v22c0 14 11 25 25 25h152c14 0 25-11 25-25v-22"}
        pathLength="1"
        stroke="#101010"
        strokeWidth="5"
        strokeLinecap="round"
        className={`auth-cable ${signupMode ? "auth-cable-reverse" : ""}`}
      />
      <path d="M128 180v8M355 180v8" stroke="#101010" strokeWidth="8" strokeLinecap="round" />
      <rect x="185" y="196" width="110" height="35" rx="6" fill="#C8FF00" stroke="#101010" strokeWidth="2" />
      <path d="M203 208h74M203 218h42" stroke="#101010" strokeWidth="3" strokeLinecap="round" />
      <circle cx="376" cy="68" r="13" fill="#C8FF00" stroke="#101010" strokeWidth="2" />
      <path d="M376 61v14M369 68h14" stroke="#101010" strokeWidth="2" strokeLinecap="round" />
      <circle cx="95" cy="192" r="5" fill="#101010" />
      <circle cx="390" cy="203" r="4" fill="#101010" />
    </svg>
  );
}
