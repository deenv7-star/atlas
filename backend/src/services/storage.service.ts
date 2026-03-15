import { env } from '../config/env.js';

export async function uploadInvoicePdf(key: string, _file: Buffer) {
  if (!env.S3_BUCKET) {
    return null;
  }

  return `s3://${env.S3_BUCKET}/${key}`;
}
