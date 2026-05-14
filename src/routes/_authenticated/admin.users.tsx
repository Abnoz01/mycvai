import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminUpdateUserRole, adminDeleteUser } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Page });

function Page() {
  const list = useServerFn(adminListUsers);
  const update = useServerFn(adminUpdateUserRole);
  const remove = useServerFn(adminDeleteUser);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: () => list() });
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter((u: any) =>
    [u.full_name, u.email, u.role].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));

  const onChangeRole = async (userId: string, role: any) => {
    try { await update({ data: { userId, role } }); toast.success("Rôle mis à jour"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (userId: string) => {
    try { await remove({ data: { userId } }); toast.success("Utilisateur supprimé"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  const roleColor: Record<string, string> = { admin: "bg-rose-500/15 text-rose-600", recruiter: "bg-violet-500/15 text-violet-600", employee: "bg-emerald-500/15 text-emerald-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Utilisateurs</h1><p className="text-sm text-muted-foreground">{data?.length ?? 0} comptes au total</p></div>
        <div className="relative w-72"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Inscription</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun utilisateur</TableCell></TableRow>}
            {filtered.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                <TableCell><Badge className={roleColor[u.role] ?? ""}>{u.role}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Select value={u.role} onValueChange={(v) => onChangeRole(u.id, v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="recruiter">Recruteur</SelectItem>
                        <SelectItem value="employee">Candidat</SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Toutes les données associées seront perdues.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(u.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
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
