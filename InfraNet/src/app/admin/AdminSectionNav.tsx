"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

type Section = {
  id: string;
  label: string;
};

export default function AdminSectionNav({
  sections,
  activeSection,
}: {
  sections: Section[];
  activeSection: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [selectedSection, setSelectedSection] = useState(activeSection);
  const [marker, setMarker] = useState({
    x: 0,
    y: 0,
    width: 3,
    height: 0,
    visible: false,
  });

  useLayoutEffect(() => {
    setSelectedSection(activeSection);
  }, [activeSection]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const link = linkRefs.current.get(selectedSection);
    if (!nav || !link) return;

    const updateMarker = () => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const isVertical = window.matchMedia("(min-width: 1024px)").matches;

      setMarker({
        x: isVertical
          ? linkRect.left - navRect.left
          : linkRect.left - navRect.left + (linkRect.width - 26) / 2,
        y: isVertical ? linkRect.top - navRect.top + 4 : navRect.height - 5,
        width: isVertical ? 3 : 26,
        height: isVertical ? linkRect.height - 8 : 3,
        visible: true,
      });
    };

    updateMarker();
    const observer = new ResizeObserver(updateMarker);
    observer.observe(nav);
    observer.observe(link);
    window.addEventListener("resize", updateMarker);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMarker);
    };
  }, [selectedSection, sections]);

  return (
    <nav
      ref={navRef}
      aria-label="Seções de gerenciamento"
      className="admin-section-nav relative flex gap-2 overflow-x-auto rounded-lg border border-line bg-white p-2 lg:sticky lg:top-6 lg:flex-col lg:overflow-visible"
    >
      <p className="hidden px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-500 lg:block">
        Gerenciamento
      </p>
      <span
        aria-hidden="true"
        className="admin-nav-marker pointer-events-none absolute left-0 top-0 z-10 rounded-full bg-brand-600 opacity-0 shadow-[0_0_12px_rgba(37,99,235,0.9)] transition-[height,transform,opacity,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          width: marker.width,
          height: marker.height,
          transform: `translate3d(${marker.x}px, ${marker.y}px, 0)`,
          opacity: marker.visible ? 1 : 0,
        }}
      />
      {sections.map((item) => (
        <Link
          key={item.id}
          ref={(node) => {
            if (node) linkRefs.current.set(item.id, node);
            else linkRefs.current.delete(item.id);
          }}
          href={`/admin?section=${item.id}`}
          aria-current={selectedSection === item.id ? "page" : undefined}
          onClick={() => setSelectedSection(item.id)}
          className={`group flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition duration-200 hover:-translate-y-px ${
            selectedSection === item.id
              ? "border-brand-700 bg-brand-50 text-brand-800 shadow-sm ring-1 ring-inset ring-brand-200"
              : "border-transparent text-ink-700 hover:bg-ink-100"
          }`}
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
            selectedSection === item.id
              ? "bg-brand-700 text-white"
              : "bg-ink-100 text-ink-500 group-hover:bg-white group-hover:text-ink-700"
          }`}>
            <SectionIcon name={item.id} />
          </span>
          <span className="flex-1">{item.label}</span>
          {selectedSection === item.id && <span aria-hidden="true" className="text-lg leading-none text-brand-700">›</span>}
        </Link>
      ))}
    </nav>
  );
}

function SectionIcon({ name }: { name: string }) {
  const iconClass = "h-[18px] w-[18px]";

  return (
    <svg
      aria-hidden="true"
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "security" && (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </>
      )}
      {name === "locations" && (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2" />
        </>
      )}
      {name === "users" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19" />
          <path d="M16 5.3a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V19" />
        </>
      )}
      {name === "racks" && (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8M8 12h8M8 17h8" />
          <circle cx="7.2" cy="7" r=".3" fill="currentColor" />
          <circle cx="7.2" cy="12" r=".3" fill="currentColor" />
          <circle cx="7.2" cy="17" r=".3" fill="currentColor" />
        </>
      )}
      {name === "switches" && (
        <>
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <path d="M7 11h.01M10 11h.01M13 11h.01M16 11h.01M8 14h8" />
        </>
      )}
      {name === "patch-panels" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 14h.01M10 14h.01M13 14h.01M16 14h.01" />
        </>
      )}
      {name === "network-points" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 4v6M20 12h-6M12 20v-6M4 12h6" />
        </>
      )}
      {name === "certifications" && (
        <>
          <path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
      {name === "bom" && (
        <>
          <path d="M9 5h10M9 12h10M9 19h10" />
          <path d="m4 5 1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" />
        </>
      )}
    </svg>
  );
}
