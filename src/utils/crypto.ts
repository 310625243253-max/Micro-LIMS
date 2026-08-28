import crypto from 'crypto';

/**
 * Generate a SHA-256 hash for electronic signatures
 * Combines sample ID, reviewer ID, timestamp, decision, and credential salt
 */
export function generateElectronicSignatureHash(params: {
  sampleId: string;
  reviewerId: string;
  timestamp: string | Date;
  decision: string;
  signerName: string;
}): string {
  const ts = typeof params.timestamp === 'string' ? params.timestamp : params.timestamp.toISOString();
  const raw = `${params.sampleId}|${params.reviewerId}|${ts}|${params.decision}|${params.signerName}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Generate a generic SHA-256 checksum for files or payloads
 */
export function generateChecksum(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
