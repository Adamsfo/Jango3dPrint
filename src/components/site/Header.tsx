import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";

export function Header() {
  const { user, signOut } = useAuth();

  const links = [
    { to: "/", label: "Início" },
    { to: "/colecao", label: "Coleção" },
    { to: "/personalizar", label: "Personalizar" },
    { to: "/sobre", label: "Sobre" },
    { to: "/contato", label: "Contato" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/65 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <Link to="/" className="group relative flex items-center hover-gold cinematic">
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,190,80,.20)_0%,rgba(255,190,80,.10)_28%,rgba(255,190,80,.04)_45%,transparent_70%)] blur-[18px] transition-opacity duration-700 group-hover:opacity-100" />
          <img
            src={logo}
            alt="JANGO 3D Print"
            className="relative z-10 h-14 w-auto object-contain transition-all duration-500 [filter:brightness(1.18)_contrast(1.25)_drop-shadow(0_0_10px_rgba(255,190,80,.35))_drop-shadow(0_0_24px_rgba(255,190,80,.18))] group-hover:scale-[1.03] group-hover:[filter:brightness(1.22)_contrast(1.28)_drop-shadow(0_0_14px_rgba(255,190,80,.42))_drop-shadow(0_0_32px_rgba(255,190,80,.24))] md:h-[88px]"
          />
        </Link>

        <nav className="hidden items-center gap-10 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative inline-flex items-center text-muted-foreground transition-all duration-[280ms] ease-out after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:bg-[linear-gradient(90deg,transparent,rgba(255,190,80,.95),transparent)] after:transition-all after:duration-[280ms] after:ease-out hover:-translate-y-px hover:text-[#ffbf5e] hover:[text-shadow:0_0_8px_rgba(255,190,80,.45),0_0_18px_rgba(255,190,80,.22)] hover:after:w-full"
              activeProps={{
                className:
                  "text-[#ffbf5e] [text-shadow:0_0_8px_rgba(255,190,80,.35),0_0_18px_rgba(255,190,80,.18)] after:w-full",
              }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-sm text-muted-foreground md:block">
                Olá, <span className="font-medium text-foreground">{user.email}</span>
              </div>

              <button
                onClick={() => signOut()}
                className="rounded-full border border-border/80 bg-card/30 px-4 py-2 text-xs font-medium uppercase tracking-widest cinematic hover:bg-card/60 hover:-translate-y-0.5"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-border/80 bg-card/30 px-4 py-2 text-xs font-medium uppercase tracking-widest cinematic hover:bg-card/60 hover:-translate-y-0.5"
              >
                Login
              </Link>

              <Link
                to="/login"
                className="rounded-full bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground shadow-glow cinematic hover:bg-primary/90 hover:-translate-y-0.5"
              >
                Cadastre-se
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
