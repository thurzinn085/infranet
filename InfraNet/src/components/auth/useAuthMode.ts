"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AuthMode = "login" | "signup";

export function useAuthMode(initialMode: AuthMode) {
  const [mode, setModeState] = useState<AuthMode>(initialMode);
  const [contentMode, setContentMode] = useState<AuthMode>(initialMode);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMode = useCallback((nextMode: AuthMode) => {
    if (nextMode === mode) return;
    if (timer.current) clearTimeout(timer.current);

    setModeState(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set("modo", nextMode === "login" ? "entrar" : "cadastro");
    window.history.replaceState(window.history.state, "", url);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const contentDelay = reducedMotion ? 0 : mobile ? 250 : 360;

    timer.current = setTimeout(() => {
      setContentMode(nextMode);
      timer.current = null;
    }, contentDelay);
  }, [mode]);

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("modo");
    if (requestedMode === "entrar" || requestedMode === "cadastro") {
      const nextMode = requestedMode === "entrar" ? "login" : "signup";
      setModeState(nextMode);
      setContentMode(nextMode);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { mode, contentMode, setMode };
}
