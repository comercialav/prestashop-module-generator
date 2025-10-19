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
 *     - Use the code from `docs/backend-proxy-example.ts` as a template.
 *     - Deploy it to a serverless platform (e.g., Vercel, Netlify).
 *     - During deployment, set the `RESEND_API_KEY` environment variable with
 *       your key from https://resend.com/.
 *
 * 2.  **Configure the URL Below:**
 *     - Once deployed, you will get a URL for your function.
 *     - Replace the placeholder value in the `BACKEND_PROXY_URL` constant below
 *       with your actual deployed URL.
 *
 * @param moduleName The name of the module being sent.
 * @param zipAsBase64 The generated module zip file, encoded as a base64 string.
 * @returns A promise that resolves on success or throws a detailed error on failure.
 */

// STEP 1: Replace this with the URL of your deployed backend proxy function.
const BACKEND_PROXY_URL = 'https://prestashop-module-generator.vercel.app/api/send-email';

export async function sendEmailNotification(moduleName: string, zipAsBase64: string): Promise<void> {
    if (BACKEND_PROXY_URL.includes('your-deployment-url')) {
        throw new Error(
            'FAIL: The backend proxy URL is not configured. Please edit services/emailService.ts and set the BACKEND_PROXY_URL constant.'
        );
    }

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
        // Step 3.1: The actual fetch call
        console.log(`DEBUG (emailService): Attempting to POST to ${BACKEND_PROXY_URL}`);
        response = await fetch(BACKEND_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        });
        console.log(`DEBUG (emailService): Received response from proxy with status: ${response.status}`);

    } catch (error) {
        // Step 4 - A: Network Error
        console.error("DEBUG (emailService): Fetch failed.", error);
        if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            throw new Error(
                `FAIL (4/5): Network Error. The application could not connect to the backend. This is often a CORS issue. Please ensure your backend at "${BACKEND_PROXY_URL}" has been redeployed with the latest CORS settings and is running correctly.`
            );
        }
        // Other unexpected fetch errors
        throw new Error(`FAIL (4/5): An unexpected network error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 4 - B: Backend/API Error (non-2xx response)
    if (!response.ok) {
        console.error(`DEBUG (emailService): Proxy returned an error status: ${response.status}`);
        let errorBody;
        try {
            errorBody = await response.json();
            console.error('DEBUG (emailService): Proxy error body:', errorBody);
        } catch (jsonError) {
            console.error('DEBUG (emailService): Could not parse error body as JSON.');
            // If the body isn't JSON, just use the status text.
            throw new Error(`FAIL (4/5): Backend proxy returned an error (Status: ${response.status} ${response.statusText}), but the error message was not in a readable format.`);
        }
        
        // Try to construct a very specific error message
        const resendError = errorBody.name && errorBody.message ? `Resend API Error (${errorBody.name}): ${errorBody.message}` : JSON.stringify(errorBody);
        throw new Error(`FAIL (4/5): The backend proxy reported an error. ${resendError}`);
    }

    // Step 4 - C: Success from proxy
    console.log('DEBUG (emailService): Proxy returned success. Email sending process complete from frontend perspective.');
    // No need to return anything on success, just don't throw an error.
}