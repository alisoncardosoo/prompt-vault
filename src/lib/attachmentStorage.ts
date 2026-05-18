import { supabase } from "./supabase";
import type { Prompt } from "./promptStore";

const ATTACHMENTS_BUCKET = "prompt-attachments";

function extensionFromName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) return "";
  return name.slice(lastDot);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("INVALID_DATA_URL");
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function makeStoragePath(
  userId: string,
  promptId: string,
  attachment: Prompt["attachments"][number],
) {
  const ext = extensionFromName(attachment.name);
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

  const uploaded = await Promise.all(
    attachments.map(async (attachment) => {
      if (attachment.url && attachment.path && !attachment.data) {
        return {
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          path: attachment.path,
          url: attachment.url,
        };
      }

      if (!attachment.data) {
        return {
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          path: attachment.path,
          url: attachment.url,
        };
      }

      const path = makeStoragePath(userId, promptId, attachment);
      const blob = dataUrlToBlob(attachment.data);
      const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, blob, {
        upsert: true,
        contentType: attachment.type || blob.type || "application/octet-stream",
      });
      if (error) throw error;

      return {
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
        path,
        url: publicUrlFor(path),
      };
    }),
  );

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
