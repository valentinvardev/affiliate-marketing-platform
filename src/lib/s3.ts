import { createHash, createHmac } from "node:crypto";

/**
 * Firma de URLs presignadas para S3 (AWS Signature Version 4), a mano.
 *
 * Se implementa acá en vez de usar @aws-sdk/* porque el deploy corre
 * `npm run build` sin `npm install`: agregar un paquete rompería el build en
 * el VPS. SigV4 es un algoritmo cerrado y `node:crypto` alcanza.
 *
 * El navegador sube DIRECTO a S3 con la URL firmada — el archivo nunca pasa
 * por el servidor, así que no hay límite de tamaño de nginx ni presión de RAM.
 */

export type S3Config = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Dominio de CloudFront SIN esquema, ej. d1234.cloudfront.net */
  cfDomain: string;
  /** Carpeta opcional para compartir el bucket entre proyectos, siempre con "/" final. */
  prefix: string;
};

/**
 * Mismos nombres de variables que media-seller-platform, para poder reusar los
 * valores del .env de ese proyecto sin traducir nada.
 */
/**
 * Lee una variable tratando "" (y espacios) como ausente.
 *
 * Es imprescindible: en el .env las opcionales quedan como VAR="", y `??` solo
 * cae al siguiente valor con null/undefined — un string vacío pasa. Si eso
 * ocurre con la región, el host sale `bucket.s3..amazonaws.com` y la subida
 * muere con un error de red que no dice nada.
 */
function envStr(v: string | undefined): string | undefined {
  const s = v?.trim();
  return s ? s : undefined;
}

export function getS3Config(): S3Config | null {
  const region = envStr(process.env.AWS_S3_REGION) ?? envStr(process.env.AWS_REGION) ?? "us-east-2";
  const bucket = envStr(process.env.AWS_S3_BUCKET);
  const accessKeyId = envStr(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = envStr(process.env.AWS_SECRET_ACCESS_KEY);
  const cfDomain = envStr(process.env.CLOUDFRONT_DOMAIN);
  if (!bucket || !accessKeyId || !secretAccessKey || !cfDomain) return null;

  const raw = envStr(process.env.AWS_S3_PREFIX);
  const prefix = raw ? raw.replace(/^\/+/, "").replace(/\/?$/, "/") : "";
  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    cfDomain: cfDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
    prefix,
  };
}

/** Aplica el prefijo configurado a una key relativa. */
export function withPrefix(cfg: S3Config, key: string): string {
  if (key.startsWith("http")) return key;
  return cfg.prefix && key.startsWith(cfg.prefix) ? key : `${cfg.prefix}${key}`;
}

const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data, "utf8").digest();
const sha256hex = (data: string) => createHash("sha256").update(data, "utf8").digest("hex");

/** Encoding que exige AWS: como encodeURIComponent pero también !'()* */
function enc(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/** Cada segmento del path se codifica por separado (las barras quedan). */
function encPath(key: string): string {
  return "/" + key.split("/").map(enc).join("/");
}

function hostFor(cfg: S3Config): string {
  // Falla fuerte y claro: una región vacía o con formato raro produciría
  // `bucket.s3..amazonaws.com`, que no resuelve por DNS y llega al navegador
  // como un "error de red" sin ninguna pista del motivo.
  if (!/^[a-z0-9-]+$/.test(cfg.region)) {
    throw new Error(`AWS_REGION inválida: "${cfg.region}". Revisá el .env del servidor.`);
  }
  if (!/^[a-z0-9.\-_]+$/i.test(cfg.bucket)) {
    throw new Error(`AWS_S3_BUCKET inválido: "${cfg.bucket}".`);
  }
  // us-east-1 usa el host sin región (así lo firman los ejemplos de AWS).
  return cfg.region === "us-east-1"
    ? `${cfg.bucket}.s3.amazonaws.com`
    : `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
}

/**
 * URL presignada. `Content-Type` NO se firma a propósito: si estuviera en los
 * headers firmados, el navegador tendría que mandar exactamente el mismo valor
 * y cualquier diferencia daría 403.
 */
export function presign(
  cfg: S3Config,
  method: "PUT" | "GET" | "DELETE",
  key: string,
  expiresIn = 3600,
  now = new Date(),
): string {
  const host = hostFor(cfg);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${enc(k)}=${enc(params[k]!)}`)
    .join("&");

  const canonicalRequest = [
    method,
    encPath(key),
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  return `https://${host}${encPath(key)}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** URL pública por CloudFront para una key ya subida. */
export function publicUrl(cfg: S3Config, key: string): string {
  return `https://${cfg.cfDomain}${encPath(withPrefix(cfg, key))}`;
}
