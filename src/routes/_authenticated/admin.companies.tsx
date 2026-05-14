import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListCompanies, adminDeleteCompany } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Search, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/companies")({ component: Page });

function Page() {
  const list = useServerFn(adminListCompanies);
  const remove = useServerFn(adminDeleteCompany);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "companies"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const filtered = (data ?? []).filter((c: any) => [c.name, c.description].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Entreprises</h1><p className="text-sm text-muted-foreground">{data?.length ?? 0} entreprises</p></div>
        <div className="relative w-72"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Logo</TableHead><TableHead>Nom</TableHead><TableHead>Description</TableHead><TableHead>Créée le</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune entreprise</TableCell></TableRow>}
            {filtered.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {c.logo_url ? <img src={c.logo_url} alt={c.name} className="h-full w-full object-cover" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md truncate">{c.description ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Supprimer cette entreprise ?</AlertDialogTitle><AlertDialogDescription>Action irréversible.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={async () => { try { await remove({ data: { id: c.id } }); toast.success("Entreprise supprimée"); qc.invalidateQueries({ queryKey: ["admin", "companies"] }); } catch (e: any) { toast.error(e.message); } }}>Supprimer</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
