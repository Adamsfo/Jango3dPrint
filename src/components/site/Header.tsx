import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/55 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="group flex items-center hover-gold cinematic">
          <div className="relative flex flex-col leading-none">
            <span className="font-display text-xl tracking-[0.22em] text-foreground md:text-2xl">
              JANGO
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.32em] text-primary/90 md:text-[11px]">
              3D PRINT
            </span>
            <span className="pointer-events-none absolute -inset-x-6 -inset-y-3 rounded-3xl bg-primary/8 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </Link>

        <nav className="hidden items-center gap-10 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-muted-foreground cinematic hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
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
