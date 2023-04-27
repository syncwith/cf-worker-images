# Optimizing website images on the fly with a Cloudflare worker and Cloudinary

## Overview

This Cloudflare worker is designed to run in front of your website, and it will optimize all of your site's images seamlessly on the fly, including:

1. Scaling images down based on device type (desktop, tablet and mobile)
2. Serving images in modern formats such as AVIF and WEBP when supported by the user's browser
3. Enabling you generate alternate video formats for HTML5 <video/> tags such as WEBM and MP4, and generating an optimized poster image for video(s)
4. If your website already uses any WEBP or AVIF images, it will downgrade these to PNG when not supported by the browser
5. All images are also optimized for filesize by adjusting quality automatically where possible

## Before you begin

This project requires:

1. A Cloudflare account (you can use their free plan!), and you'll need to have a website setup
2. A Cloudinary account (again you can use their free plan!)

## Getting started

1. Clone the GitHub repository
2. Create a new worker at Cloudflare, choose `HTTP Handler` as the type
3. Replace values in `wrangler.toml` including: name, ORIGIN, WORKER_HOST, CLOUDINARY_CLOUD
4. Run `yarn` to install dependencies
5. Run `yarn deploy` to deploy the worker to Cloudflare, this uses the `name` field in `wrangler.toml` to find your worker, and Cloudflare will require you to login
   - The first time you do this Cloudflare will launch your browser to let you authenticate
6. Run `yarn tail` to see live logs from the worker
7. You should now be able to test your worker at a url like https://your-worker.your-domain.workers.dev

## Deploying to Production

To use this in production you'd need to add a `Worker route` in your website at Cloudflare, and bind it to the worker. You'd then need to modify the values in `worker.toml`

## Worker.toml

This is a standard file for Cloudflare workers, where you specify configuration values and environment variables.

1. `name` This is the name of the Cloudflare worker you created on your Cloudflare dashboard
2. `CLOUDINARY_CLOUD` This is the id of your cloud environment at Cloudinary, its likely a 10 character alphanumeric string
3. `ORIGIN` is only for use in testing (not production), it should be your host name like `google.com`
4. `WORKER_HOST` is only for use in testing (not production), it should be your worker's hostname, likely a value like `your-worker.your-domain.workers.dev`

## Notes

1. This project relies on your website's images having file extensions (eg gif, jpg, png) so it can identify the type of image. If your images don't have extensions, then they won't be transformed at all.
