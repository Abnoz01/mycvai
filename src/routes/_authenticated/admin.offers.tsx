import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListOffers, adminDeleteOffer, adminToggleOfferStatus } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Search, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/offers")({ component: Page });

function Page() {
  const list = useServerFn(adminListOffers);
  const remove = useServerFn(adminDeleteOffer);
  const toggle = useServerFn(adminToggleOfferStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "offers"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const filtered = (data ?? []).filter((o: any) =>
    [o.title, o.location, o.recruiter_name, o.contract_type].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "offers"] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Offres d'emploi</h1><p className="text-sm text-muted-foreground">{data?.length ?? 0} offres</p></div>
        <div className="relative w-72"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Recruteur</TableHead><TableHead>Type</TableHead><TableHead>Lieu</TableHead><TableHead>Vues</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune offre</TableCell></TableRow>}
            {filtered.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium max-w-xs truncate">{o.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.recruiter_name}</TableCell>
                <TableCell><Badge variant="outline">{o.contract_type}</Badge></TableCell>
                <TableCell className="text-sm">{o.location ?? "—"}</TableCell>
                <TableCell className="text-sm">{o.views}</TableCell>
                <TableCell><Badge variant={o.status === "open" ? "default" : "secondary"}>{o.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" title={o.status === "open" ? "Fermer" : "Rouvrir"}
                      onClick={async () => { try { await toggle({ data: { id: o.id, status: o.status === "open" ? "closed" : "open" } }); toast.success("Statut mis à jour"); refresh(); } catch (e: any) { toast.error(e.message); } }}>
                      {o.status === "open" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle><AlertDialogDescription>Toutes les candidatures associées seront supprimées.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={async () => { try { await remove({ data: { id: o.id } }); toast.success("Offre supprimée"); refresh(); } catch (e: any) { toast.error(e.message); } }}>Supprimer</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
