"use client"

import { useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Paperclip, Download, FileText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Doc {
  id: string
  file_name: string
  mime_type: string
  size_bytes: number
  created_at: string
  storage_path: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsList({
  grantId,
  documents,
  canEdit,
}: {
  grantId: string
  documents: Doc[]
  canEdit: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const form = new FormData()
        form.append("file", file)
        form.append("grantId", grantId)
        const res = await fetch("/api/documents/upload", { method: "POST", body: form })
        if (!res.ok) {
          const { error } = await res.json()
          toast.error(error ?? "Upload failed")
          return
        }
        toast.success("File uploaded")
        // Refresh is handled server-side; trigger a soft reload
        window.location.reload()
      } catch {
        toast.error("Upload error")
      }
    })
  }

  async function handleDownload(doc: Doc) {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from("grant-documents")
      .createSignedUrl(doc.storage_path, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank")
    } else {
      toast.error("Could not generate download link")
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="size-4 animate-spin" /> Uploading…</>
            ) : (
              <><Paperclip className="size-4" /> Attach file</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">PDF, Word, TXT, PNG, JPG — max 25 MB</p>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents attached.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDownload(doc)}
                className="shrink-0"
              >
                <Download className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
