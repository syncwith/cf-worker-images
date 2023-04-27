import mobile from "is-mobile";

export type UserAgentCapabilities = {
  webp: boolean;
  avif: boolean;
};

export const ACCEPT_HEADER = "Accept";
export const mimeTypeAVIF = "image/avif";
export const mimeTypeWEBP = "image/webp";

export const isImageRequest = (req: Request) => {
  const url = new URL(req.url);
  return url.pathname.startsWith("/image");
};

export const getDeviceType = (req: Request) => {
  const ua = req.headers.get("User-Agent") || undefined;
  const isMobile = mobile({ ua });
  if (isMobile) return "mobile";

  const isTablet = mobile({ ua, tablet: true });

  if (isTablet) return "tablet";

  return "desktop";
};

// Env variables defined in wrangler.toml
export interface Env {
  ORIGIN: string;
  WORKER_HOST: string | undefined;
  CLOUDINARY_CLOUD: string;
}

export const getOriginalRequestHostReplace = (env: Env, request: Request) => {
  if (env.WORKER_HOST) {
    const url = request.url.replace(env.ORIGIN, env.WORKER_HOST);
    console.log(`Processing ${url}`);
    return new Request(url, request);
  }

  return request;
};

export const getActualRequest = (env: Env, request: Request) => {
  if (env.WORKER_HOST) {
    const url = request.url.replace(env.WORKER_HOST, env.ORIGIN);
    console.log(`Processing ${url}`);
    return new Request(url, request);
  }

  return request;
};

// example accept header value
// text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
export const getUserAgentCapabilities = (
  req: Request
): UserAgentCapabilities => {
  const capabilities: UserAgentCapabilities = {
    webp: false,
    avif: false,
  };
  const accept = req.headers.get(ACCEPT_HEADER);
  if (accept && accept.toLowerCase().indexOf(mimeTypeWEBP) >= 0) {
    capabilities.webp = true;
  }
  if (accept && accept.toLowerCase().indexOf(mimeTypeAVIF) >= 0) {
    capabilities.avif = true;
  }
  return capabilities;
};
