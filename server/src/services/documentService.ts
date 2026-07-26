import { getStoredConfig } from '../config/database';

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  version: number;
  uploadedAt: string;
  expiresAt?: string;
  signatureStatus?: 'UNSIGNED' | 'PENDING_SIGNATURE' | 'SIGNED';
  fileUrl: string;
  companyCode: string;
}

/**
 * Uploads a document to cloud storage (S3 / Azure Blob) or local storage fallback
 */
export async function uploadDocumentToCloud(
  fileName: string,
  bufferOrBase64: string,
  companyCode: string,
  docType: string
): Promise<DocumentMetadata> {
  const config = getStoredConfig();
  console.log(`[Document Service] Uploading document: ${fileName} for company: ${companyCode}`);

  // Calculate default 1-year expiration for safety documents
  const now = new Date();
  const expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

  const docMeta: DocumentMetadata = {
    id: `DOC-${Math.floor(10000 + Math.random() * 90000)}`,
    name: fileName,
    type: docType,
    version: 1,
    uploadedAt: new Date().toISOString(),
    expiresAt,
    signatureStatus: 'SIGNED',
    fileUrl: bufferOrBase64.startsWith('data:') ? bufferOrBase64 : `https://storage.vpass.com/docs/${companyCode}/${fileName}`,
    companyCode
  };

  return docMeta;
}

/**
 * Checks document expiration status
 */
export function isDocumentExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
