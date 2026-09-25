import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createFieldNoteServerFn } from "@/server/field/create-field-note";

const MAX_NOTE_LENGTH = 2000;

export type FieldNote = {
  id: string;
  note: string;
  authorName: string;
  createdAt: Date | string;
};

export function FieldNoteCaptureCard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const trimmedNote = note.trim();

  const save = () => {
    if (!trimmedNote) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await createFieldNoteServerFn({
          data: { projectId, note: trimmedNote },
        });

        if (!result.ok) {
          toast.error(result.formError ?? "Unable to save the note.");
          return;
        }

        toast.success(result.message ?? "Note saved.");
        setNote("");
        await router.invalidate();
      } catch {
        // Keep the text in the box so a dropped jobsite connection never loses a note.
        toast.error("Could not reach the server. Your note is still here — try again.");
      }
    });
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">Add Field Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={5}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Pump truck arrived 40 minutes late. Crew held on the east slab."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {trimmedNote.length}/{MAX_NOTE_LENGTH}
          </p>
          <Button className="min-w-32" disabled={!trimmedNote || isPending} onClick={save}>
            {isPending ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FieldNotesList({
  notes,
  action,
}: {
  notes: FieldNote[];
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Recent Notes</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No field notes yet.</p>
        ) : (
          notes.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border/60 px-3 py-3">
              <p className="whitespace-pre-wrap text-sm">{entry.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {entry.authorName} • {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
