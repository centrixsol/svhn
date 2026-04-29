import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateImage(apiKey, prompt, inputImage = null) {
  if (!apiKey?.trim()) throw new Error('Please enter your Gemini API key.');
  if (!prompt?.trim()) throw new Error('Please enter a prompt.');

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image-generation',
  });

  const parts = [{ text: prompt }];
  if (inputImage) {
    parts.push({
      inlineData: { data: inputImage.base64, mimeType: inputImage.mimeType },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });

  const candidate = result.response.candidates?.[0];
  if (!candidate?.content?.parts) throw new Error('No content returned from Gemini.');

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  const textPart = candidate.content.parts.find((p) => p.text);
  throw new Error(
    textPart?.text
      ? `Gemini returned text instead of an image: "${textPart.text.slice(0, 120)}"`
      : 'No image was returned. Try rephrasing your prompt.'
  );
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type, dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
