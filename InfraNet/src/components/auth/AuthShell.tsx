"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import AuthIllustration from "@/components/auth/AuthIllustration";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { AuthMode, useAuthMode } from "@/components/auth/useAuthMode";

export default function AuthShell({ initialMode }: { initialMode: AuthMode }) {
  const { mode, contentMode, setMode } = useAuthMode(initialMode);
  const [notice, setNotice] = useState<string | null>(null);
  const [formHeight, setFormHeight] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const loginContentRef = useRef<HTMLDivElement>(null);
  const signupContentRef = useRef<HTMLDivElement>(null);
  const loginTitleRef = useRef<HTMLHeadingElement>(null);
  const signupTitleRef = useRef<HTMLHeadingElement>(null);
  const previousContentMode = useRef(contentMode);

  useEffect(() => {
    const activeContent = contentMode === "login" ? loginContentRef.current : signupContentRef.current;
    if (!activeContent || !frameRef.current) return;
    const updateHeight = () => setFormHeight(activeContent.scrollHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(activeContent);
    return () => observer.disconnect();
  }, [contentMode]);

  useEffect(() => {
    if (previousContentMode.current !== contentMode) {
      const targetTitle = contentMode === "login" ? loginTitleRef.current : signupTitleRef.current;
      targetTitle?.focus();
      previousContentMode.current = contentMode;
    }
  }, [contentMode]);

  const signupMode = contentMode === "signup";
  const movingSignup = mode === "signup";
  const frameStyle = {
    "--auth-form-height": formHeight === null ? "auto" : `${formHeight}px`,
  } as CSSProperties;

  function registerComplete() {
    setNotice("Conta criada. Entre com suas novas credenciais.");
    setMode("login");
  }

  function formContentClass(itemMode: AuthMode) {
    if (itemMode === contentMode) {
      const isLeaving = mode !== contentMode;
      const exitDirection = mode === "signup" ? "-translate-x-8" : "translate-x-8";
      return `relative opacity-100 ${isLeaving ? exitDirection : "translate-x-0"}`;
    }

    const isEntering = itemMode === mode;
    const entryDirection = mode === "signup" ? "translate-x-8" : "-translate-x-8";
    return `pointer-events-none absolute inset-x-0 top-0 opacity-0 ${isEntering ? entryDirection : "translate-x-0"}`;
  }

  return (
    <main className="auth-page flex min-h-[100svh] items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
      <div className="auth-card relative w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-[#2b2b2b] bg-[#101010] md:h-[min(680px,calc(100svh_-_48px))] md:min-h-[620px]">
        <section
          aria-label="Apresentação"
          className={`auth-feature relative mx-[10px] mt-[10px] flex h-[164px] flex-col justify-center overflow-hidden rounded-[20px] bg-[#C8FF00] px-5 py-5 text-[#101010] transition-transform duration-[800ms] ease-[cubic-bezier(.77,0,.18,1)] md:absolute           md:inset-y-[10px] md:left-[10px] md:mx-0 md:mt-0 md:h-auto md:w-[calc(50%_-_20px)] md:px-10 md:py-9 ${
          movingSignup ? "md:translate-x-[calc(100%_+_20px)]" : "md:translate-x-0"
          }`}
        >
          <div
            key={contentMode}
            className="auth-feature-copy relative z-10 mx-auto w-full max-w-[390px] text-center"
            aria-live="polite"
          >
            <p className="mx-auto max-w-[390px] font-display text-[clamp(1.45rem,3vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.045em]">
              {signupMode
                ? "Comece agora e mapeie a sua rede."
                : "Gerencie sua infraestrutura de forma inteligente."}
            </p>
            <p className="mx-auto mt-3 hidden max-w-[370px] text-sm leading-6 text-[#101010]/75 md:block">
              {signupMode
                ? "Crie a conta e cadastre locais, racks e pontos de rede."
                : "Pontos de rede, racks e testes de certificação num só lugar."}
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full border border-[#101010]/10 md:hidden" />
          <div className="pointer-events-none absolute -bottom-24 -right-2 h-48 w-48 rounded-full border border-[#101010]/10 md:hidden" />
          <div className="pointer-events-none absolute bottom-2 right-6 z-0 hidden w-[86%] opacity-90 md:block">
            <AuthIllustration signupMode={signupMode} />
          </div>
        </section>

        <div className="auth-mode-switch relative mx-[10px] mt-3 grid grid-cols-2 rounded-xl border border-[#2b2b2b] bg-[#171717] p-1 md:hidden">
          <span
            aria-hidden="true"
            className={`auth-mode-indicator absolute h-10 w-[calc(50%_-_4px)] rounded-lg bg-[#C8FF00] transition-transform duration-500 ease-[cubic-bezier(.77,0,.18,1)] ${
              movingSignup ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            aria-pressed={!movingSignup}
            onClick={() => setMode("login")}
            className={`relative z-10 min-h-10 rounded-lg font-display text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF00] ${
              movingSignup ? "text-white" : "text-[#101010]"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            aria-pressed={movingSignup}
            onClick={() => setMode("signup")}
            className={`relative z-10 min-h-10 rounded-lg font-display text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF00] ${
              movingSignup ? "text-[#101010]" : "text-white"
            }`}
          >
            Criar conta
          </button>
        </div>

        <section
          aria-label={signupMode ? "Formulário de criação de conta" : "Formulário de acesso"}
          className={`auth-form-panel relative mx-[10px] mt-0 px-4 pb-7 pt-6 transition-transform duration-[800ms] ease-[cubic-bezier(.77,0,.18,1)] md:absolute md:inset-y-[10px] md:left-[10px] md:mx-0 md:my-0 md:flex md:w-[calc(50%_-_20px)] md:items-center md:overflow-y-auto md:px-8 md:py-7 ${
            movingSignup ? "md:translate-x-0" : "md:translate-x-[calc(100%_+_20px)]"
          }`}
        >
          <div
            ref={frameRef}
            className="auth-form-frame w-full"
            style={frameStyle}
          >
            <div
              ref={loginContentRef}
              aria-hidden={contentMode !== "login"}
              inert={contentMode !== "login"}
              className={`auth-form-content w-full ${formContentClass("login")}`}
            >
              <h1
                ref={loginTitleRef}
                tabIndex={-1}
                className="mb-6 font-display text-3xl font-semibold tracking-[-0.045em] text-white sm:text-[2.1rem]"
              >
                Entrar
              </h1>
              <LoginForm
                notice={notice}
                onSwitchToSignup={() => {
                  setNotice(null);
                  setMode("signup");
                }}
              />
            </div>
            <div
              ref={signupContentRef}
              aria-hidden={contentMode !== "signup"}
              inert={contentMode !== "signup"}
              className={`auth-form-content w-full ${formContentClass("signup")}`}
            >
              <h1
                ref={signupTitleRef}
                tabIndex={-1}
                className="mb-3 font-display text-3xl font-semibold tracking-[-0.045em] text-white sm:text-[2.1rem]"
              >
                Criar conta
              </h1>
              <SignupForm
                onSwitchToLogin={() => {
                  setNotice(null);
                  setMode("login");
                }}
                onSuccess={registerComplete}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
