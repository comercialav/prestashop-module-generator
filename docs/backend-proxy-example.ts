/**
 * =================================================================================
 * CRITICAL: THIS IS BACKEND CODE (UPDATED TO USE THE OFFICIAL RESEND SDK)
 * =================================================================================
 *
 * This file is NOT part of the frontend application. It is an example of a
 * serverless function that must be deployed separately to a backend service
 * like Vercel or Netlify. The Node.js code you found is perfect for this!
 *
 * WHY?
 * Your secret RESEND_API_KEY cannot be placed in frontend code, as it would be
 * exposed to everyone. This backend function acts as a secure "proxy" that
 * keeps your key safe on a server.
 *
 * Your frontend calls -> YOUR DEPLOYED FUNCTION (e.g., /api/send-email)
 * YOUR DEPLOYED FUNCTION (with secret key) calls -> Resend API using the SDK
 *
 * =================================================================================
 *
 * How to use this file:
 * ---------------------
 * 1. Deploy this code as a serverless function. Vercel is highly recommended.
 * 2. In your project's root, create an `api` directory.
 * 3. Place this file inside it as `send-email.ts` (path: `/api/send-email.ts`).
 * 4. Make sure your deployment environment has the `resend` package. Vercel
 *    often handles this automatically, or you can add it to a `package.json`.
 * 5. In your Vercel project settings, add an Environment Variable:
 *    - Name: `RESEND_API_KEY`
 *    - Value: your_secret_resend_api_key (e.g., re_ZpQj1cxN_...)
 * 6. Deploy. Vercel will give you a URL.
 * 7. Take that URL (e.g., `https://my-app.vercel.app/api/send-email`) and
 *    paste it into the `BACKEND_PROXY_URL` constant in `services/emailService.ts`
 *    in your frontend code.
 *
 * *** IMPORTANT: REDEPLOYMENT ***
 * ANY time you make changes to THIS file, you MUST redeploy your project on
 * Vercel for the changes to become live. The NetworkError you're seeing is
 * likely because the deployed version doesn't have the latest CORS updates.
 *
 */

// Import the Resend SDK. Your deployment environment (like Vercel)
// will need to install this dependency.
import { Resend } from 'resend';

// This is an example for a Vercel Edge Function environment.
export const config = {
  runtime: 'edge',
};

// Define CORS headers. Allowing all origins ('*') is common for public APIs.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};


export default async function handler(request: Request) {
  console.log('--- New Request to /api/send-email (Resend SDK Version w/ CORS) ---');

  // Handle CORS preflight requests from the browser.
  if (request.method === 'OPTIONS') {
    console.log('DEBUG (Proxy): Handling OPTIONS preflight request.');
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    console.log(`DEBUG (Proxy): Denied non-POST request (method: ${request.method})`);
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('DEBUG (Proxy) FATAL: RESEND_API_KEY environment variable not found on the server.');
    return new Response(JSON.stringify({ message: 'Server configuration error: API key missing.' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Initialize Resend with the secret key from the server's environment
  const resend = new Resend(apiKey);

  try {
    const frontendPayload = await request.json();

    // The exact payload structure from the Resend Node.js SDK
    const { data, error } = await resend.emails.send({
      from: 'PrestaShop ModuleGenius <onboarding@resend.dev>',
      to: frontendPayload.to, // Expects an array of strings
      subject: frontendPayload.subject,
      html: frontendPayload.html,
      attachments: frontendPayload.attachments,
    });

    if (error) {
      console.error('DEBUG (Proxy): Resend SDK returned an error.', error);
      // Forward the detailed error from the SDK to our frontend
      return new Response(JSON.stringify(error), {
        status: 400, // Or another appropriate error code
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    console.log('DEBUG (Proxy): Resend SDK call successful. Sending success response back to frontend.');
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`DEBUG (Proxy): An unexpected error occurred: ${errorMessage}`);
    return new Response(JSON.stringify({ message: `Proxy handler error: ${errorMessage}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}