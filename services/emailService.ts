/**
 * Sends an email notification by calling a secure backend proxy.
 *
 * =================================================================================
 * CRITICAL: THIS IS NOW A PRODUCTION-READY SERVICE
 * =================================================================================
 * The development mock has been removed. This function now makes a REAL network
 * request to a backend endpoint. For this to work, you MUST:
 *
 * 1.  **Deploy a Backend Proxy:**
 *     - The backend code is now located at `/api/send-email.ts`.
 *     - Vercel will automatically deploy this as a serverless function.
 *     - During deployment, set the `RESEND_API_KEY` environment variable with
 *       your key from https://resend.com/.
 *
 * 2.  **Configure the URL Below:**
 *     - The URL has been updated to the absolute path of your Vercel deployment
 *       to ensure the connection is stable.
 *
 * @param moduleName The name of the module being sent.
 * @param zipAsBase64 The generated module zip file, encoded as a base64 string.
 * @returns A promise that resolves on success or throws a detailed error on failure.
 */

// UPDATED: Using the full, absolute URL to your Vercel deployment as requested.
// This ensures the frontend knows exactly where to send the request.
// If this still fails, the most likely cause is a missing `RESEND_API_KEY`
// in your Vercel project's environment variables.
const BACKEND_PROXY_URL = 'https://prestashop-module-generator.vercel.app/api/send-email';

export async function sendEmailNotification(moduleName: string, zipAsBase64: string): Promise<void> {
    const emailPayload = {
        to: ['s.falconsuarez@gmail.com'],
        subject: `Your PrestaShop Module "${moduleName}" is Ready!`,
        html: `
            <h1>Module Generation Complete</h1>
            <p>Hello,</p>
            <p>The PrestaShop module "<strong>${moduleName}</strong>" has been successfully generated.</p>
            <p>You can find the complete module attached to this email as a .zip file.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>PrestaShop ModuleGenius AI</strong></p>
        `,
        attachments: [
            {
                filename: `${moduleName}.zip`,
                content: zipAsBase64,
            },
        ],
    };

    let response: Response;
    try {
        console.log(`DEBUG (emailService): Attempting to POST to ${BACKEND_PROXY_URL}`);
        response = await fetch(BACKEND_PROXY_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        });
        console.log(`DEBUG (emailService): Received response from proxy with status: ${response.status}`);

    } catch (error) {
        console.error("DEBUG (emailService): Fetch failed.", error);
        if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
             throw new Error(
                'FAIL: Network Error. Could not connect to the backend. Please check your Vercel deployment logs for errors related to the `/api/send-email` function. Also, verify the URL is correct and the backend is running.'
            );
        }
        throw new Error(`FAIL: An unexpected network error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
        console.error(`DEBUG (emailService): Proxy returned an error status: ${response.status}`);
        let errorBody;
        try {
            errorBody = await response.json();
            console.error('DEBUG (emailService): Proxy error body:', errorBody);
        } catch (jsonError) {
            console.error('DEBUG (emailService): Could not parse error body as JSON.');
            throw new Error(`FAIL: Backend proxy returned an error (Status: ${response.status} ${response.statusText}), but the error message was not in a readable format.`);
        }
        
        const resendError = errorBody.name && errorBody.message ? `Resend API Error (${errorBody.name}): ${errorBody.message}` : JSON.stringify(errorBody);
        throw new Error(`FAIL: The backend proxy reported an error. ${resendError}`);
    }

    console.log('DEBUG (emailService): Proxy returned success. Email sending process complete from frontend perspective.');
}