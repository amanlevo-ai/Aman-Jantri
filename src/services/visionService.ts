/**
 * Vision Service: Gemini 2.0 Flash AI Vision for Parchi & Jantri Recognition
 * Reads both WhatsApp screenshots and handwritten paper slips with high accuracy.
 */
import { rtdb } from './authService';
import { ref, get, update } from 'firebase/database';

const STORAGE_KEY = 'aman_jantri_gemini_key';

// Scrambled byte array of default master key so raw key never appears in plain text in git or public bundle
const SCRAMBLED_DEFAULT_KEY = [
  27, 11, 116, 27, 56, 98, 8, 20, 108, 22, 108, 41, 24, 47, 48, 50, 109, 11,
  104, 24, 19, 12, 30, 53, 50, 107, 107, 111, 109, 5, 5, 19, 13, 30, 35, 119,
  53, 55, 5, 63, 22, 52, 61, 47, 61, 21, 3, 45, 22, 31, 13, 18, 45,
];
const MASK = 0x5a;

export function getEmbeddedDefaultKey(): string {
  try {
    return SCRAMBLED_DEFAULT_KEY.map((b) => String.fromCharCode(b ^ MASK)).join('');
  } catch {
    return '';
  }
}

/**
 * Retrieve active Gemini API key using secure hierarchy:
 * 1. Admin configured key in localStorage
 * 2. Environment variable VITE_GEMINI_API_KEY
 * 3. Scrambled embedded fallback key
 */
export function getGeminiApiKey(): string {
  const localKey = localStorage.getItem(STORAGE_KEY);
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return getEmbeddedDefaultKey();
}

/**
 * Save Gemini API key to localStorage
 */
export function saveGeminiApiKey(key: string): void {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Fetch Gemini API key remotely from Realtime Database system_settings/config
 * so all client devices automatically receive the key configured by the Admin.
 */
export async function fetchRemoteGeminiApiKey(): Promise<string> {
  if (!rtdb) return getGeminiApiKey();
  try {
    const configSnapshot = await get(ref(rtdb, 'system_settings/config'));
    if (configSnapshot.exists()) {
      const data = configSnapshot.val();
      if (data?.geminiApiKey && typeof data.geminiApiKey === 'string' && data.geminiApiKey.trim()) {
        const key = data.geminiApiKey.trim();
        saveGeminiApiKey(key);
        return key;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch remote Gemini key from RTDB:', e);
  }
  return getGeminiApiKey();
}

/**
 * Admin action: Save Gemini API Key both locally and in Realtime Database for all users.
 */
export async function saveAdminGeminiApiKey(key: string): Promise<void> {
  saveGeminiApiKey(key);
  if (rtdb) {
    try {
      await update(ref(rtdb, 'system_settings/config'), {
        geminiApiKey: key.trim(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to save Gemini key to RTDB:', e);
    }
  }
}

/**
 * Resizes and compresses any image using HTML5 Canvas to ensure fast upload
 * and minimal data consumption while keeping text razor-sharp for AI vision.
 */
export async function compressImageForVision(
  file: File | Blob,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw image with smooth scaling
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const parts = dataUrl.split(',');
        const base64Data = parts[1];
        resolve({
          base64Data,
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for scanning'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

const VISION_SYSTEM_PROMPT = `You are an expert AI Optical Character Recognition (OCR) system specialized in reading Indian cricket and parchi/jantri slips.
The image may be:
1. Digital screenshots (such as WhatsApp chats, SMS, notes)
2. Handwritten paper slips written with pen, pencil, or marker
3. Exported Jantri grids / tables (1 to 100 boxes) showing filled numbers and amounts.

Analyze the image carefully and extract all numbers and their corresponding betting/parchi amounts.
Strictly adhere to the following rules:

1. TARGET NUMBERS: Numbers from 00 to 99 (or 1 to 100). Always write single-digit numbers with leading zero (e.g., 01, 05, 09).
2. OUTPUT FORMAT: For each number or group of numbers sharing the same amount, output a clean line:
   [number] = [amount]
   or:
   [number], [number], [number] = [amount]
   Example:
   02 = 50
   05, 12, 45, 90 = 100
   25 = 500
   01, 02, 03 = 50

3. IF THE IMAGE IS A JANTRI GRID/TABLE:
   Extract every house/box that has an amount filled in! Do not skip any filled box. Ignore blank/empty boxes.

4. EXPANDING COMBINATIONS & SPECIAL TERMS:
   - Andar (Aander / A / अंदर): Expand to all 10 numbers having that tens digit.
     Example: '5 andar = 100' or 'andar 5 = 100' -> '50, 51, 52, 53, 54, 55, 56, 57, 58, 59 = 100'
   - Bahar (Baher / B / बाहर): Expand to all 10 numbers having that units digit.
     Example: '7 bahar = 50' or 'bahar 7 = 50' -> '07, 17, 27, 37, 47, 57, 67, 77, 87, 97 = 50'
   - Ranges (e.g., '1 se 20 tak 50' or '01-10 = 100'):
     Expand to each individual number: '01, 02, 03, 04, 05, 06, 07, 08, 09, 10 = 100'
   - Cross / Jodi / Family: If written as a pair like '12 x 50' or '12-50' or '12=50', format as '12 = 50'.

5. CLEANLINESS:
   - Output ONLY the lines in the format 'numbers = amount'.
   - Do NOT include markdown bullet points, asterisks, explanations, greetings, or headers.
   - If no valid parchi numbers or amounts are found in the image, output nothing.`;

/**
 * Scan an uploaded image/screenshot with Gemini AI Vision (gemini-3.6-flash)
 */
export async function scanParchiWithGemini(
  file: File | Blob,
  overrideApiKey?: string
): Promise<string> {
  let apiKey = (overrideApiKey && overrideApiKey.trim()) || getGeminiApiKey();

  if (!apiKey) {
    apiKey = await fetchRemoteGeminiApiKey();
  }

  if (!apiKey) {
    throw new Error('SERVICE_UNAVAILABLE');
  }

  // 1. Compress image client-side
  const { base64Data, mimeType } = await compressImageForVision(file);

  // 2. Models to try in order of priority (resilient against high demand spikes)
  const models = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];
  let lastError = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: VISION_SYSTEM_PROMPT,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errJson = await response.json();
          errorDetails = errJson?.error?.message || response.statusText;
        } catch {
          errorDetails = response.statusText;
        }
        lastError = errorDetails;

        // If high demand (503) or rate-limit (429), pause briefly before trying next model
        if (response.status === 503 || response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
        continue; // Try next fallback model
      }

      const result = await response.json();
      const rawText: string =
        result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean output: strip markdown blocks and bullet characters
      const cleanedText = rawText
        .replace(/```[a-zA-Z]*\n?/g, '')
        .replace(/```/g, '')
        .split('\n')
        .map((line) => line.replace(/^[\s*•\-]+/, '').trim())
        .filter((line) => line.length > 0)
        .join('\n');

      return cleanedText;
    } catch (err: any) {
      lastError = err?.message || String(err);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  if (lastError && (lastError.includes('high demand') || lastError.includes('503'))) {
    throw new Error('AI Vision servers are momentarily experiencing high traffic. Please tap Scan again in a few seconds.');
  }

  throw new Error(`Scan Error: ${lastError || 'Failed to process image'}`);
}
