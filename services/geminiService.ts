import { GoogleGenAI } from "@google/genai";
import { AI_FUSION_PROMPT } from "../constants";

// 初始化 AI 客户端
export const createGenAIClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

/**
 * AI 图像融合生成
 * @param apiKey - API Key
 * @param imageBase64 - 包含背景和纹身的完整合成图 (Base64格式，去除data:image前缀)
 * @returns 融合后的图片 Base64 字符串 (不带前缀)
 */
export const generateFusion = async (
  apiKey: string,
  imageBase64: string
): Promise<string> => {
  try {
    const ai = createGenAIClient(apiKey);
    
    console.log("Starting generation with Gemini 2.5 Flash Image...");

    // 使用 gemini-2.5-flash-image 模型进行图像生成/编辑任务
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: AI_FUSION_PROMPT,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
      config: {
        temperature: 0.4,
        // 关键：针对纹身/皮肤图像，必须放宽安全限制
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
        ],
      }
    });

    // 解析响应中的图片数据
    let resultImageBase64 = '';
    
    // 1. 优先查找 inlineData (图片)
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          resultImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    // 2. 如果没有图片，检查是否返回了文本（通常是拒绝理由或错误描述）
    if (!resultImageBase64) {
      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
      const textResponse = textPart?.text || "Unknown error";
      
      console.warn("AI returned text instead of image:", textResponse);
      
      // 抛出具体错误供前端显示
      throw new Error(`AI Generation Failed: ${textResponse.slice(0, 100)}...`);
    }

    return resultImageBase64;
    
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 提取更友好的错误信息
    let msg = error.message || "Unknown API Error";
    if (msg.includes("403") || msg.includes("API key")) {
        msg = "Invalid API Key or Permission Denied.";
    } else if (msg.includes("429")) {
        msg = "Quota exceeded. Please try again later.";
    } else if (msg.includes("SAFETY")) {
        msg = "Blocked by Safety Filters.";
    }
    throw new Error(msg);
  }
};