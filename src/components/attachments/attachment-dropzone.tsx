export function AttachmentDropzone({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
      <span className="text-sm font-medium">Drop files here or click to choose</span>
      <span className="text-xs text-muted-foreground">
        JPEG, PNG, WEBP, and PDF files up to 10 MB each
      </span>
      <input
        type="file"
        multiple
        className="hidden"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      {files.length > 0 ? (
        <div className="space-y-1 text-xs text-muted-foreground">
          {files.map((file) => (
            <p key={`${file.name}-${file.size}`}>{file.name}</p>
          ))}
        </div>
      ) : null}
    </label>
  );
}
