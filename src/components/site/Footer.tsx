import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/70 bg-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="group relative inline-flex items-center">
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,190,80,.16)_0%,rgba(255,190,80,.08)_34%,transparent_70%)] blur-[18px] transition-opacity duration-700 group-hover:opacity-100" />
            <img
              src={logo}
              alt="JANGO 3D Print"
              className="relative z-10 h-14 w-auto object-contain transition-all duration-500 [filter:brightness(1.15)_contrast(1.2)_drop-shadow(0_0_10px_rgba(255,190,80,.28))] group-hover:scale-[1.03] group-hover:[filter:brightness(1.2)_contrast(1.24)_drop-shadow(0_0_14px_rgba(255,190,80,.36))] md:h-[72px]"
            />
          </Link>
          <p className="mt-5 max-w-md text-pretty text-muted-foreground">
            Luminárias decorativas feitas à mão com impressão 3D. Cada peça é pensada para iluminar
            com carinho.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Navegar
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/colecao" className="hover:text-foreground text-muted-foreground">
                Coleção
              </Link>
            </li>
            <li>
              <Link to="/personalizar" className="hover:text-foreground text-muted-foreground">
                Personalizar
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-foreground text-muted-foreground">
                Nossa história
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-foreground text-muted-foreground">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Contato
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> ola@jango3d.com.br
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4" /> @jango3d
            </li>
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
