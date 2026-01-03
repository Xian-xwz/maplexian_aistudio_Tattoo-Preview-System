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
              mimeType: 'image/jpeg', // 假设输入为 JPEG，通用性较好
              data: imageBase64,
            },
          },
        ],
      },
      // 增加配置以获得更高质量
      config: {
        temperature: 0.4, // 降低随机性，保持原图特征
      }
    });

    // 解析响应中的图片数据
    let resultImageBase64 = '';
    
    // 遍历 parts 查找图片数据
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          resultImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!resultImageBase64) {
      throw new Error("No image data returned from Gemini API");
    }

    return resultImageBase64;
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};