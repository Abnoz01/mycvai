import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListReviews, adminDeleteReview } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: Page });

function Page() {
  const list = useServerFn(adminListReviews);
  const remove = useServerFn(adminDeleteReview);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "reviews"], queryFn: () => list() });

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Avis des utilisateurs</h1><p className="text-sm text-muted-foreground">{data?.length ?? 0} avis publiés</p></div>
      {isLoading && <div className="text-muted-foreground">Chargement...</div>}
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{r.author_name}</div>
                  <div className="text-xs text-muted-foreground">{r.job_title ?? "—"}</div>
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle><AlertDialogDescription>Action irréversible.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={async () => { try { await remove({ data: { id: r.id } }); toast.success("Avis supprimé"); qc.invalidateQueries({ queryKey: ["admin", "reviews"] }); } catch (e: any) { toast.error(e.message); } }}>Supprimer</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="mt-3 text-sm">{r.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
