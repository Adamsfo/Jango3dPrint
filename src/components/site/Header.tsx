import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/60 text-accent-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          JANGO<span className="text-muted-foreground">3D</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
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
                className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-widest transition hover:bg-muted"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-widest transition hover:bg-muted"
              >
                Login
              </Link>

              <Link
                to="/login"
                className="rounded-full bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-background transition hover:bg-foreground/85"
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
