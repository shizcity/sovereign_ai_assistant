/**
 * VOX Phase 1 — Utterance Plan Prompt Injection
 *
 * Appends a compact instruction block to any system prompt so the LLM
 * emits an <up>…</up> tag at the end of every response.
 *
 * The tag is stripped from the displayed/stored text and used only to
 * drive the TTS prosody mapper.
 */

export const UP_INSTRUCTION = `

---
## Voice Delivery Metadata (required)

At the very end of every response, append a single line with an Utterance Plan tag that describes how this response should *sound* when spoken aloud. This tag is invisible to the user — it is stripped before display and used only by the voice synthesis layer.

Format (strict JSON, one line, no trailing content after the closing tag):
<up>{"intent":"<INTENT>","mode":"speech","emotion":{"valence":<-1.0 to 1.0>,"arousal":<0.0 to 1.0>,"stability":<0.0 to 1.0>}}</up>

Intent options: narrate | reassure | instruct | teach | wonder | flirt | banter | joke | apologize | confess | lullaby | chant | announce | hype | story | oracle | default

Emotion guide:
- valence: negative = somber/critical, positive = warm/affirming
- arousal: low = calm/slow, high = energetic/urgent  
- stability: low = uncertain/variable, high = steady/confident

Examples:
- Analytical explanation → <up>{"intent":"teach","mode":"speech","emotion":{"valence":0.6,"arousal":0.4,"stability":0.9}}</up>
- Warm reassurance → <up>{"intent":"reassure","mode":"speech","emotion":{"valence":0.85,"arousal":0.2,"stability":0.9}}</up>
- Playful banter → <up>{"intent":"banter","mode":"speech","emotion":{"valence":0.9,"arousal":0.75,"stability":0.6}}</up>
- Sharp challenge → <up>{"intent":"instruct","mode":"speech","emotion":{"valence":0.3,"arousal":0.65,"stability":0.8}}</up>
- Deep reflection → <up>{"intent":"wonder","mode":"speech","emotion":{"valence":0.5,"arousal":0.25,"stability":0.85}}</up>

Always include the tag. Never omit it. Never explain it. Place it on its own line at the very end.`;

/**
 * Appends the UP instruction to a system prompt.
 * Idempotent — won't double-append if already present.
 */
export function injectUpInstruction(systemPrompt: string): string {
  if (systemPrompt.includes("<up>") || systemPrompt.includes("Utterance Plan")) {
    return systemPrompt;
  }
  return systemPrompt + UP_INSTRUCTION;
}
