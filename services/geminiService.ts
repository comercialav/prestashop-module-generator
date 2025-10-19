import { GoogleGenAI } from "@google/genai";
import { GenerationState, GenerationStatusEnum } from '../types';

if (!process.env.API_KEY) {
  // In a real app, this would be handled more gracefully.
  // The environment variable is expected to be set by the runtime.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getModel = () => {
  return 'gemini-2.5-flash';
};

const createPrompt = (description: string, mode: 'create' | 'modify'): string => {
  const action = mode === 'create' ? 'create a new module' : 'modify an existing module';
  return `
    You are a world-class expert on PrestaShop 8.1/8.2 module development. A user wants to ${action}.
    Their request is: "${description}".

    First, decide on a valid, PSR-4 compliant PrestaShop module name in CamelCase based on the user's request (e.g., if the request is "display best sellers", the name could be 'DisplayBestSellers'). This name will be used for the module's main folder and PHP file.
    Second, create a step-by-step plan for how you will build this module. The plan should include research steps (checking documentation, GitHub, Stack Overflow) and development steps (file structure, coding).
    Third, generate the complete PHP code for the main module file. The filename and folder name MUST use the module name you decided on.
    Finally, generate the code for the \`config.xml\` file for the module, also placing it in the module's folder.

    Format your response EXACTLY as follows, streaming the output incrementally. DO NOT add any other text or explanations outside of this structure.

    [PLAN_START]
    1. First step of the plan...
    2. Second step of the plan...
    3. ...
    [PLAN_END]

    [CODE_START:MyModuleName/MyModuleName.php]
    <?php
    // ... PHP code for the main module file
    [CODE_END]

    [CODE_START:MyModuleName/config.xml]
    <?xml version="1.0" encoding="UTF-8" ?>
    <module>
        <!-- ... config.xml content -->
    </module>
    [CODE_END]

    [SUCCESS:Module generation is complete.]
    `;
};

export async function* generateModuleStream(
  description: string,
  mode: 'create' | 'modify'
): AsyncGenerator<Partial<GenerationState>> {
  const model = getModel();
  const prompt = createPrompt(description, mode);

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
    });

    let buffer = '';
    let currentFile = '';
    const files = new Map<string, string>();

    for await (const chunk of responseStream) {
      buffer += chunk.text;

      // Process Plan
      if (buffer.includes('[PLAN_START]')) {
        const planStartIndex = buffer.indexOf('[PLAN_START]') + '[PLAN_START]'.length;
        if (buffer.includes('[PLAN_END]')) {
          const planEndIndex = buffer.indexOf('[PLAN_END]');
          const planText = buffer.substring(planStartIndex, planEndIndex).trim();
          const planSteps = planText.split('\n').map(s => s.trim()).filter(Boolean);
          yield { plan: planSteps };
          buffer = buffer.substring(planEndIndex + '[PLAN_END]'.length);
        }
      }

      // Process Code Blocks
      while (buffer.includes('[CODE_START:')) {
        const codeStartIndex = buffer.indexOf('[CODE_START:');
        const codeStartTagEnd = buffer.indexOf(']', codeStartIndex);
        if (codeStartTagEnd === -1) break;

        currentFile = buffer.substring(codeStartIndex + '[CODE_START:'.length, codeStartTagEnd);

        if (buffer.includes('[CODE_END]')) {
          const codeEndIndex = buffer.indexOf('[CODE_END]');
          const code = buffer.substring(codeStartTagEnd + 1, codeEndIndex).trim();
          files.set(currentFile, code);
          yield { files: new Map(files) };
          buffer = buffer.substring(codeEndIndex + '[CODE_END]'.length);
          currentFile = '';
        } else {
          // Incomplete code block, break and wait for more chunks
          break;
        }
      }

      // Process Success Message
      if (buffer.includes('[SUCCESS:')) {
        const successStartIndex = buffer.indexOf('[SUCCESS:') + '[SUCCESS:'.length;
        if (buffer.includes(']')) {
          const successEndIndex = buffer.indexOf(']');
          const message = buffer.substring(successStartIndex, successEndIndex).trim();
          yield { status: GenerationStatusEnum.COMPLETED, completionMessage: message };
          buffer = buffer.substring(successEndIndex + 1);
        }
      }
    }
  } catch (e) {
    console.error("Error during Gemini API call:", e);
    const error = e instanceof Error ? e : new Error("An unknown API error occurred");
    yield { status: GenerationStatusEnum.ERROR, error: error.message };
  }
}