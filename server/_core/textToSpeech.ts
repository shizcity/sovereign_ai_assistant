/**
 * Text-to-Speech helper using internal TTS service
 *
 * Example usage:
 * ```tsx
 * // Frontend component
 * const synthesizeMutation = trpc.voice.synthesize.useMutation({
 *   onSuccess: (data) => {
 *     const audio = new Audio(data.audioUrl);
 *     audio.play();
 *   }
 * });
 * 
 * synthesizeMutation.mutate({
 *   text: "Hello, how can I help you today?",
 *   voice: "alloy", // optional
 *   speed: 1.0 // optional
 * });
 * ```
 */
import { ENV } from "./env";
import { storagePut } from "../storage";

export type SynthesizeOptions = {
  text: string; // Text to convert to speech
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"; // Voice selection
  speed?: number; // Speed: 0.25 to 4.0, default 1.0
};

export type SynthesizeResponse = {
  audioUrl: string; // URL to the generated audio file
  duration?: number; // Duration in seconds (if available)
};

export type SynthesizeError = {
  error: string;
  code: "TEXT_TOO_LONG" | "SYNTHESIS_FAILED" | "SERVICE_ERROR" | "STORAGE_ERROR";
  details?: string;
};

/**
 * Convert text to speech using the internal TTS service
 * 
 * @param options - Text and voice configuration
 * @returns Audio URL or error
 */
export async function synthesizeSpeech(
  options: SynthesizeOptions
): Promise<SynthesizeResponse | SynthesizeError> {
  try {
    // Step 1: Validate environment configuration
    if (!ENV.forgeApiUrl) {
      return {
        error: "Text-to-speech service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set"
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "Text-to-speech service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set"
      };
    }

    // Step 2: Validate input
    if (!options.text || options.text.trim().length === 0) {
      return {
        error: "Text cannot be empty",
        code: "TEXT_TOO_LONG",
        details: "Please provide text to synthesize"
      };
    }

    // OpenAI TTS has a 4096 character limit
    if (options.text.length > 4096) {
      return {
        error: "Text exceeds maximum length",
        code: "TEXT_TOO_LONG",
        details: `Text is ${options.text.length} characters, maximum allowed is 4096`
      };
    }

    // Step 3: Call the TTS service
    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;
    
    const fullUrl = new URL(
      "v1/audio/speech",
      baseUrl
    ).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: options.text,
        voice: options.voice || "alloy",
        speed: options.speed || 1.0,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Text-to-speech service request failed",
        code: "SYNTHESIS_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
      };
    }

    // Step 4: Get audio buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Step 5: Upload to S3 storage
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `voice-tts/${timestamp}-${randomSuffix}.mp3`;
    
    const uploadResult = await storagePut(
      fileKey,
      audioBuffer,
      "audio/mpeg"
    );

    if (!uploadResult.url) {
      return {
        error: "Failed to store generated audio",
        code: "STORAGE_ERROR",
        details: "Storage upload returned no URL"
      };
    }

    return {
      audioUrl: uploadResult.url,
    };

  } catch (error) {
    // Handle unexpected errors
    return {
      error: "Text-to-speech generation failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

/**
 * Example tRPC procedure implementation:
 * 
 * ```ts
 * // In server/routers.ts
 * import { synthesizeSpeech } from "./_core/textToSpeech";
 * 
 * export const voiceRouter = router({
 *   synthesize: protectedProcedure
 *     .input(z.object({
 *       text: z.string(),
 *       voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
 *       speed: z.number().min(0.25).max(4.0).optional(),
 *     }))
 *     .mutation(async ({ input, ctx }) => {
 *       const result = await synthesizeSpeech(input);
 *       
 *       // Check if it's an error
 *       if ('error' in result) {
 *         throw new TRPCError({
 *           code: 'BAD_REQUEST',
 *           message: result.error,
 *           cause: result,
 *         });
 *       }
 *       
 *       return result;
 *     }),
 * });
 * ```
 */
