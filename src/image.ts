import {
  UserAgentCapabilities,
  getDeviceType,
  Env,
  getOriginalRequestHostReplace,
  getUserAgentCapabilities,
} from "./lib";

type ImageFormat = "jpg" | "png" | "webp" | "gif" | "avif";

const PARAM_FORMAT = "f";
const PARAM_POSTER = "poster";

const getImageFormat = (request: Request): ImageFormat | undefined => {
  const url = new URL(request.url);
  const filename = url.pathname.toLowerCase();

  if (filename.endsWith("jpg") || filename.endsWith("jpeg")) {
    return "jpg";
  }
  if (filename.endsWith("png")) {
    return "png";
  }
  if (filename.endsWith("webp")) {
    return "webp";
  }
  if (filename.endsWith("avif")) {
    return "avif";
  }
  if (filename.endsWith("gif")) {
    return "gif";
  }

  return undefined;
};

const getImageOutputOptions = (
  request: Request,
  format: ImageFormat | undefined,
  capabilities: UserAgentCapabilities
): string[] => {
  // Handle a specific format request, for example converting an animated GIF to a WEBM video
  // with a query param like: /image/12345.gif?f=webm
  const url = new URL(request.url);
  const queryParamFormat = url.searchParams.get(PARAM_FORMAT);
  if (queryParamFormat) {
    return [`f_${queryParamFormat}`];
  }

  // Generate a poster (image) from a video, with a query param like: /image/12345.mp4?poster=1
  const isPoster = url.searchParams.get(PARAM_POSTER) === "1";
  if (isPoster) {
    // pg_0 tells Cloudinary to use the first frame of the video
    // try to deliver the poster in the most optimal format
    if (capabilities.avif) return ["pg_0", "f_avif"];
    if (capabilities.webp) return ["pg_0", "f_webp"];
    return ["pg_0", "f_png"];
  }

  const options: string[] = [];

  if (format === "gif") {
    // we handle animated GIFS differently for now, try to aggressively optimize them for quality
    options.push("fl_lossy");
    options.push("q_50");
  } else {
    // scale images down (but never up)
    options.push("c_limit");
    const deviceType = getDeviceType(request);
    // Choose a max width based on deviceType
    if (deviceType === "mobile") {
      options.push("w_640");
    } else if (deviceType === "tablet") {
      options.push("w_960");
    } else {
      options.push("w_1200");
    }
    // Let Cloudinary optimize the image for quality
    options.push("q_auto:good");
    // if we know what format it is (and its not GIF) then we can optimize it
    if (format) {
      if (capabilities.avif) {
        options.push("f_avif");
      } else if (capabilities.webp) {
        options.push("f_webp");
      } else if (format === "webp" || format === "avif") {
        // Downgrade from modern formats to PNG if not supported
        options.push("f_png");
      }
    }
  }

  return options;
};

export const isCloudinaryRequest = (req: Request) => {
  const userAgent = req.headers.get("User-Agent");
  return userAgent && userAgent.indexOf("Cloudinary") >= 0;
};

export const getImageOriginUrl = (env: Env, request: Request) => {
  // Check if the client suppports AVIF or WebP
  const capabilities = getUserAgentCapabilities(request);
  // Determine the format of the original image
  const origFormat = getImageFormat(request);
  // Do the actual work of choosing the optimized configuration for Cloudinary for this image
  const options = getImageOutputOptions(request, origFormat, capabilities);

  // Does nothing in production, but in dev makes cloudinary come back to our dev worker
  const workerRequest = getOriginalRequestHostReplace(env, request);

  // Remove the query string parameters that are meant for us (that we checked for already)
  const parsed = new URL(workerRequest.url);
  parsed.searchParams.delete(PARAM_FORMAT);
  parsed.searchParams.delete(PARAM_POSTER);

  const url = `https://res.cloudinary.com/${
    env.CLOUDINARY_CLOUD
  }/image/fetch/${options.join(",")}/${parsed.toString()}`;
  console.log("Rewriting image origin url", url);
  return url;
};
