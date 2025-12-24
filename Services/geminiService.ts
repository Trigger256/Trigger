

import { GoogleGenAI, Chat, Content, Modality, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error ${context} with Gemini API:`, error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid') || error.message.includes('not found') || error.message.includes('permission denied') || error.message.includes('Requested entity was not found')) {
            return new Error('The selected API key is invalid or lacks permissions. Please select a valid key from a paid Google Cloud project. See ai.google.dev/gemini-api/docs/billing for details.');
        }
        return new Error(`Failed to ${context}: ${error.message}`);
    }
    return new Error(`An unknown error occurred while ${context}.`);
};

const extractImageData = (response: any): string => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
        }
    }
    throw new Error('No image data found in the API response. The prompt may have been blocked.');
};

const dataUrlToBlob = (dataUrl: string) => {
    const [header, base64Data] = dataUrl.split(',');
    if (!base64Data) throw new Error("Invalid image data URL.");
    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error("Could not determine MIME type.");
    const mimeType = mimeTypeMatch[1];
    return { data: base64Data, mimeType };
};

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    return extractImageData(response);
  } catch (error) {
    throw handleApiError(error, 'generating image');
  }
}

export async function editImage(imageDataUrl: string, prompt: string): Promise<string> {
  try {
    const imagePart = { inlineData: dataUrlToBlob(imageDataUrl) };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, { text: prompt }] },
    });
    return extractImageData(response);
  } catch (error) {
    throw handleApiError(error, 'editing image');
  }
}

export async function inpaintImage(imageDataUrl: string, maskDataUrl: string): Promise<string> {
    try {
        const imagePart = { inlineData: dataUrlToBlob(imageDataUrl) };
        const maskPart = { inlineData: dataUrlToBlob(maskDataUrl) };
        const promptPart = { text: "Remove the masked object and fill in the area with a realistic background that matches the rest of the image." };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [promptPart, imagePart, maskPart] },
        });
        return extractImageData(response);
    } catch (error) {
        throw handleApiError(error, 'inpainting image');
    }
}

export async function removeBackground(imageDataUrl: string): Promise<string> {
  try {
    const imagePart = { inlineData: dataUrlToBlob(imageDataUrl) };
    const prompt = "Segment the main subject of this image with high precision and make the background completely transparent. The output must be a PNG file with an alpha channel preserving the original resolution.";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, { text: prompt }] },
    });
    return extractImageData(response);
  } catch (error) {
    throw handleApiError(error, 'removing background');
  }
}

export async function createChatSession(imageDataUrl: string): Promise<Chat> {
  try {
    const imagePart = { inlineData: dataUrlToBlob(imageDataUrl) };
    const initialHistory: Content[] = [
      {
        role: "user",
        parts: [
          imagePart,
          { text: "This is the image we will be discussing. I am a user of your photo editor application. I will ask you questions or give you commands about it." },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Great! I see the image. I'm ready to help. What would you like to do with it?" }],
      },
    ];

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: initialHistory,
    });
    return chat;
  } catch (error) {
    throw handleApiError(error, 'starting chat session');
  }
}

export async function createBasicChatSession(): Promise<Chat> {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: [],
      config: {
          systemInstruction: "You are a friendly and helpful AI assistant for a photo editor application. Your goal is to inspire creativity and assist users with their photo editing tasks. If a user uploads an image later, your context will be reset to focus on that image."
      }
    });
    return chat;
  } catch (error) {
    throw handleApiError(error, 'starting basic chat session');
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const audioPart = { inlineData: { data: base64Audio, mimeType } };
    const promptPart = { text: "Transcribe the following audio recording." };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [promptPart, audioPart] },
    });
    
    const transcription = response.text;
    if (!transcription) {
        throw new Error("The API did not return a transcription.");
    }
    return transcription;
  } catch (error) {
    throw handleApiError(error, 'transcribing audio');
  }
}

async function pollVideoOperation(
    videoAi: GoogleGenAI,
    initialOperation: any,
    onProgress: (progress: { message: string; percentage: number }) => void
): Promise<any> {
    let operation = initialOperation;
    let percentage = 10;
    const progressMessages = [
        'Analyzing characters and story...',
        'Generating initial video frames...',
        'Interpolating motion between scenes...',
        'Rendering key transitions...',
        'Applying cinematic effects...',
        'Finalizing video stream...'
    ];
    let messageIndex = 0;

    while (!operation.done) {
        onProgress({ message: progressMessages[messageIndex % progressMessages.length], percentage });
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
            operation = await videoAi.operations.getVideosOperation({ operation: operation });
        } catch (pollError) {
            console.warn("Polling failed, but will continue waiting:", pollError);
        }

        percentage = Math.min(percentage + 8, 95);
        messageIndex++;
    }

    onProgress({ message: 'Fetching video file...', percentage: 98 });
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation succeeded, but no download link was provided.');
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video file. Status: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    onProgress({ message: 'Video ready!', percentage: 100 });
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return { videoUrl, operation };
}


export async function generateInitialVideo(
    prompt: string,
    durationInSeconds: number,
    onProgress: (progress: { message: string; percentage: number }) => void,
    startingImageDataUrl?: string | null
): Promise<{ videoUrl: string, operation: any }> {
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        let imagePayload;
        if (startingImageDataUrl) {
            const { data: imageBytes, mimeType } = dataUrlToBlob(startingImageDataUrl);
            imagePayload = { imageBytes, mimeType };
        }

        onProgress({ message: 'Initializing video generation...', percentage: 5 });
        const initialOperation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: imagePayload,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9',
                durationSecs: durationInSeconds
            }
        });

        return await pollVideoOperation(videoAi, initialOperation, onProgress);

    } catch (error) {
        throw handleApiError(error, 'generating initial video');
    }
}

export async function extendVideo(
    previousOperation: any,
    prompt: string,
    durationInSeconds: number,
    onProgress: (progress: { message: string; percentage: number }) => void
): Promise<{ videoUrl: string, operation: any }> {
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const previousVideo = previousOperation.response?.generatedVideos?.[0]?.video;
    if (!previousVideo) {
        throw new Error("Invalid previous video data. Cannot extend.");
    }

    try {
        onProgress({ message: 'Initializing video extension...', percentage: 5 });
        const initialOperation = await videoAi.models.generateVideos({
            model: 'veo-3.1-generate-preview', // Extension might require the higher quality model
            prompt,
            video: previousVideo,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: previousVideo.aspectRatio || '16:9',
                durationSecs: durationInSeconds
            }
        });

        // FX-FIX: Corrected typo from on_progress to onProgress
        return await pollVideoOperation(videoAi, initialOperation, onProgress);
    } catch (error) {
        throw handleApiError(error, 'extending video');
    }
}