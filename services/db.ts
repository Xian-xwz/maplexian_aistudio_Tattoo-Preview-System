import { MockDB, mockDbInstance } from './mockDb';
import { Tattoo } from '../types';

// --- 配置区域 ---
// 通过此开关控制是否使用 MockDB，未来可从环境变量读取
const USE_MOCK_DB = true; 

/**
 * Data Access Layer (DAL)
 * 统一的数据访问接口，业务组件应通过此接口访问数据，而不是直接调用 mockDb 或 API
 */
export const db = {
  // 纹身模块数据访问
  tattoos: {
    // 获取所有纹身
    getAll: async (): Promise<Tattoo[]> => {
      if (USE_MOCK_DB) {
        return await mockDbInstance.getAll<Tattoo>('tattoos');
      } else {
        // TODO: 实现真实 API 调用
        return Promise.resolve([]);
      }
    },

    // 上传用户纹身
    upload: async (file: File): Promise<Tattoo> => {
      if (USE_MOCK_DB) {
        // 使用 mockDb 内部工具转换 Base64 并存储
        const base64 = await mockDbInstance.fileToBase64(file);
        const newTattoo: Tattoo = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          imageBase64: base64,
          isDefault: false
        };
        return await mockDbInstance.create('tattoos', newTattoo);
      } else {
        return Promise.reject(new Error("Real API upload not implemented"));
      }
    },

    // 替换纹身 (仅限非默认)
    replace: async (id: string, file: File): Promise<Tattoo> => {
      if (USE_MOCK_DB) {
        const tattoo = await mockDbInstance.get<Tattoo>('tattoos', id);
        if (!tattoo) throw new Error("Tattoo not found");
        if (tattoo.isDefault) {
          throw new Error("Cannot replace default tattoo");
        }
        
        const base64 = await mockDbInstance.fileToBase64(file);
        // 更新图片和名称
        const updated = await mockDbInstance.update<Tattoo>('tattoos', id, {
          name: file.name,
          imageBase64: base64
        });
        return updated!;
      } else {
        return Promise.reject(new Error("Real API replace not implemented"));
      }
    },

    // 删除纹身
    delete: async (id: string): Promise<boolean> => {
      if (USE_MOCK_DB) {
        // 业务逻辑校验：不能删除默认纹身
        const tattoo = await mockDbInstance.get<Tattoo>('tattoos', id);
        if (tattoo && tattoo.isDefault) {
          console.warn("Operation denied: Cannot delete default tattoo");
          return false;
        }
        return await mockDbInstance.delete('tattoos', id);
      } else {
        return Promise.reject(new Error("Real API delete not implemented"));
      }
    }
  },

  // 设置模块数据访问
  settings: {
    get: async (id: string = 'default') => {
      return USE_MOCK_DB ? await mockDbInstance.get('settings', id) : null;
    },
    update: async (data: any, id: string = 'default') => {
      return USE_MOCK_DB ? await mockDbInstance.update('settings', id, data) : null;
    }
  },
  
  // 用户模块数据访问
  users: {
    getCurrent: async () => {
       // 模拟获取当前登录用户
       return USE_MOCK_DB ? await mockDbInstance.get('users', 'guest') : null;
    }
  }
};