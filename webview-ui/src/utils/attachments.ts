import type { PbiAttachment } from '../types';

export function newAttachmentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Read local files as base64 payloads for Azure DevOps attachments. */
export async function filesToAttachments(files: FileList | File[]): Promise<PbiAttachment[]> {
  const list = Array.from(files);
  const out: PbiAttachment[] = [];
  for (const file of list) {
    const dataUrl = await readFileAsDataUrl(file);
    const comma = dataUrl.indexOf(',');
    const dataBase64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    out.push({
      id: newAttachmentId(),
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      dataBase64
    });
  }
  return out;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(reader.result as string);
    reader.onerror = (): void => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Find ```mermaid ... ``` blocks in description (or any text) and turn them into .mmd attachments.
 */
export function extractMermaidBlocksAsAttachments(text: string): PbiAttachment[] {
  const re = /```mermaid\s*\n([\s\S]*?)```/gi;
  const out: PbiAttachment[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    i++;
    const body = m[1].trim();
    const dataBase64 = btoa(unescape(encodeURIComponent(body)));
    out.push({
      id: newAttachmentId(),
      fileName: `mermaid-diagram-${i}.mmd`,
      mimeType: 'text/plain',
      dataBase64
    });
  }
  return out;
}
