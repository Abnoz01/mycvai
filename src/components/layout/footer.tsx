import { Link } from "@tanstack/react-router";
import { Sparkles, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">CV Match</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Plateforme de recrutement intelligente.</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Compte</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-primary">Connexion</Link></li>
            <li><Link to="/signup/employee" className="hover:text-primary">Candidat</Link></li>
            <li><Link to="/signup/recruiter" className="hover:text-primary">Recruteur</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@cvmatch.app</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +212 5XX XX XX XX</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Casablanca, MA</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CV Match. All rights reserved.
      </div>
    </footer>
  );
}
