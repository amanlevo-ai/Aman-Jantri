/**
 * Vision Service: Gemini 2.0 Flash AI Vision for Parchi & Jantri Recognition
 * Reads both WhatsApp screenshots and handwritten paper slips with high accuracy.
 */

const STORAGE_KEY = 'aman_jantri_gemini_key';

/**
 * Retrieve saved Gemini API key from localStorage or Vite environment variable
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
  return '';
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

const VISION_SYSTEM_PROMPT = `You are an expert AI Optical Character Recognition (OCR) system specialized in reading Indian cricket and parchi/jantri slips, both digital screenshots (such as WhatsApp chats, SMS, notes) and handwritten paper slips written with pen.

Analyze the image carefully and extract all numbers and their corresponding betting/parchi amounts.
Strictly adhere to the following rules:

1. TARGET NUMBERS: Numbers from 00 to 99 (or 1 to 100). Always write single-digit numbers with leading zero (e.g., 01, 05, 09).
2. OUTPUT FORMAT: For each group of numbers sharing the same amount, output a line in this exact format:
   [number], [number], [number] = [amount]
   Example:
   05, 12, 45, 90 = 100
   25 = 500
   01, 02, 03 = 50

3. EXPANDING COMBINATIONS & SPECIAL TERMS:
   - Andar (Aander / A / अंदर): Expand to all 10 numbers having that tens digit.
     Example: '5 andar = 100' or 'andar 5 = 100' -> '50, 51, 52, 53, 54, 55, 56, 57, 58, 59 = 100'
   - Bahar (Baher / B / बाहर): Expand to all 10 numbers having that units digit.
     Example: '7 bahar = 50' or 'bahar 7 = 50' -> '07, 17, 27, 37, 47, 57, 67, 77, 87, 97 = 50'
   - Ranges (e.g., '1 se 20 tak 50' or '01-10 = 100'):
     Expand to each individual number: '01, 02, 03, 04, 05, 06, 07, 08, 09, 10 = 100'
   - Cross / Jodi / Family: If written as a pair like '12 x 50' or '12-50' or '12=50', format as '12 = 50'.

4. CLEANLINESS:
   - Output ONLY the lines in the format 'numbers = amount'.
   - Do NOT include any explanations, greetings, markdown blocks (no \`\`\` or \`\`\`json), or headers.
   - If no valid parchi numbers or amounts are found in the image, output nothing.`;

/**
 * Scan an uploaded image/screenshot with Gemini 2.0 Flash Vision
 */
export async function scanParchiWithGemini(
  file: File | Blob,
  overrideApiKey?: string
): Promise<string> {
  const apiKey = (overrideApiKey && overrideApiKey.trim()) || getGeminiApiKey();

  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }

  // 1. Compress image client-side
  const { base64Data, mimeType } = await compressImageForVision(file);

  // 2. Call Gemini 2.0 Flash REST endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
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
      maxOutputTokens: 2048,
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
    throw new Error(`Gemini Scan Error (${response.status}): ${errorDetails}`);
  }

  const result = await response.json();
  const rawText: string =
    result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean output
  const cleanedText = rawText
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return cleanedText;
}
