"use client";

import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/app/pill";

/**
 * Date input with a visible placeholder and calendar icon. Native iOS date inputs render as a blank
 * box when empty, so we draw our own hint on top. Tapping anywhere still opens the native picker.
 */
export function DateField({ name, defaultValue = "", label }: { name: string; defaultValue?: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  // Clear our copy of the value when the surrounding form is reset after a successful submit.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () => setValue("");
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <span className="relative mt-1 block">
      <input
        ref={ref}
        type="date"
        name={name}
        aria-label={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} date-field pr-11 ${value ? "text-fg" : "text-transparent"}`}
      />
      {!value && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-normal text-muted">Select a date</span>
      )}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    </span>
  );
}
