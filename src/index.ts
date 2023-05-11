import { getImageOriginUrl, isCloudinaryRequest } from "./image";
import { Env, isImageRequest, getActualRequest } from "./lib";

/**
 * Our main entry point
 */
export default {
  async fetch(
    origRequest: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    console.log(origRequest.url);
    const request = getActualRequest(env, origRequest);

    // If its a request for an image, and its NOT a request from Cloudinary for a source iamge
    // Then we want to handle it and return an optimized images from Cloundary
    if (isImageRequest(request) && !isCloudinaryRequest(request)) {
      const imageRequest = new Request(
        getImageOriginUrl(env, request),
        request
      );
      // Call the default Cloudflare fetch method to get the image from Cloudinary
      return fetch(imageRequest);
    } else {
      // Ask Cloudflare to fetch the request from the origin
      return fetch(request);
    }
  },
};
