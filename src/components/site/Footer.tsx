import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60 bg-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/60">
              <Sparkles className="h-4 w-4" />
            </span>
            JANGO<span className="text-muted-foreground">3D</span>
          </Link>
          <p className="mt-5 max-w-md text-pretty text-muted-foreground">
            Luminárias decorativas infantis feitas à mão com impressão 3D.
            Cada peça é pensada para iluminar com carinho os primeiros anos.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Navegar
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/colecao" className="hover:text-foreground text-muted-foreground">Coleção</Link></li>
            <li><Link to="/personalizar" className="hover:text-foreground text-muted-foreground">Personalizar</Link></li>
            <li><Link to="/sobre" className="hover:text-foreground text-muted-foreground">Nossa história</Link></li>
            <li><Link to="/contato" className="hover:text-foreground text-muted-foreground">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Contato
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> ola@jango3d.com.br</li>
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4" /> @jango3d</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} JANGO3D. Feito com carinho no Brasil.</p>
          <p>Impressão 3D artesanal · Personalização exclusiva</p>
        </div>
      </div>
    </footer>
  );
}
