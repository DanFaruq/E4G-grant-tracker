import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
])

// Magic byte signatures for MIME validation
const MAGIC: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: "application/pdf",  bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/png",        bytes: [0x89, 0x50, 0x4e, 0x47] }, // PNG
  { mime: "image/jpeg",       bytes: [0xff, 0xd8, 0xff] },        // JPEG
]

function checkMagicBytes(buffer: Uint8Array, mime: string): boolean {
  // Only validate types we have signatures for; let others pass
  const sig = MAGIC.find((m) => m.mime === mime)
  if (!sig) return true
  return sig.bytes.every((b, i) => buffer[i] === b)
}

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: UserRole } | null }

  if (!profile || !["admin", "team_member"].includes(profile.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get("file") as File | null
  const grantId = form.get("grantId") as string | null

  if (!file || !grantId) {
    return NextResponse.json({ error: "Missing file or grantId" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `File type "${file.type}" is not allowed` }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  if (!checkMagicBytes(bytes, file.type)) {
    return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "bin"
  const storagePath = `${grantId}/${crypto.randomUUID()}.${ext}`

  const service = await createServiceClient()
  const { error: uploadError } = await service.storage
    .from("grant-documents")
    .upload(storagePath, bytes, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: dbError } = await (service.from("documents") as AnyTable).insert({
    grant_id: grantId,
    uploader_id: user.id,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
  })

  if (dbError) {
    // Clean up orphaned storage object
    await service.storage.from("grant-documents").remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  await (service.from("activity_history") as AnyTable).insert({
    grant_id: grantId,
    actor_id: user.id,
    action: "document.uploaded",
    metadata: { file_name: file.name },
  })

  return NextResponse.json({ ok: true })
}
