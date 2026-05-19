import { supabase } from "./supabase";
import type { Prompt } from "./promptStore";

const ATTACHMENTS_BUCKET = "prompt-attachments";

function extensionFromName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) return "";
  return name.slice(lastDot);
}

function extensionFromMime(mime: string): string {
  const lower = mime.toLowerCase();
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (lower.includes("png")) return ".png";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("heic")) return ".heic";
  return "";
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // More reliable on mobile Safari than manual atob decoding for larger payloads.
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error("INVALID_DATA_URL");
  return res.blob();
}

function makeStoragePath(
  userId: string,
  promptId: string,
  attachment: Prompt["attachments"][number],
) {
  const ext = extensionFromName(attachment.name) || extensionFromMime(attachment.type || "");
  return `${userId}/${promptId}/${attachment.id}${ext}`;
}

function publicUrlFor(path: string): string {
  const { data } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPromptAttachments(
  userId: string,
  promptId: string,
  attachments: Prompt["attachments"],
): Promise<Prompt["attachments"]> {
  if (attachments.length === 0) return [];

  const uploaded: Prompt["attachments"] = [];

  for (const attachment of attachments) {
    if (attachment.url && attachment.path && !attachment.data) {
      uploaded.push({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
        path: attachment.path,
        url: attachment.url,
      });
      continue;
    }

    if (!attachment.data) {
      uploaded.push({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
        path: attachment.path,
        url: attachment.url,
      });
      continue;
    }

    const path = makeStoragePath(userId, promptId, attachment);
    const blob = await dataUrlToBlob(attachment.data);
    const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: attachment.type || blob.type || "application/octet-stream",
    });
    if (error) throw error;

    uploaded.push({
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      type: attachment.type || blob.type,
      path,
      url: publicUrlFor(path),
    });
  }

  return uploaded;
}

export function getAttachmentPreviewUrl(attachment: Prompt["attachments"][number]): string | null {
  if (attachment.data) return attachment.data;
  if (attachment.url) return attachment.url;
  if (attachment.path) return publicUrlFor(attachment.path);
  return null;
}

export function isAttachmentSynced(attachment: Prompt["attachments"][number]): boolean {
  return Boolean(attachment.url || attachment.path);
}
