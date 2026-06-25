import "./src/env.js";

// Headers de seguridad para todas las respuestas.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },                       // anti clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },                  // no adivinar MIME
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }, // HTTPS forzado
];

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      // Supabase storage — se ajustará al proyecto real del usuario
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
