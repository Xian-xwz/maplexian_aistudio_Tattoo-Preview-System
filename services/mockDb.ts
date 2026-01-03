import { Tattoo, UserConfig, Language, DeviceMode, Theme } from '../types';
import { DEFAULT_TATTOOS } from '../constants';

// --- 数据库表结构定义 ---

// 纹身表行数据
export interface TattooTableItem extends Tattoo {}

// 用户表行数据 (虚拟)
export interface UserTableItem {
  id: string;
  name: string;
  apiCalls: number;
}

// 设置表行数据
export interface SettingsTableItem extends UserConfig {
  id: string; // 通常主键为 'default'
}

// 历史记录表行数据
export interface HistoryTableItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
}

// 数据库 Schema
interface DBSchema {
  tattoos: Map<string, TattooTableItem>;
  users: Map<string, UserTableItem>;
  settings: Map<string, SettingsTableItem>;
  history: Map<string, HistoryTableItem>;
}

export class MockDB {
  private db: DBSchema;

  constructor() {
    // 初始化空表
    this.db = {
      tattoos: new Map(),
      users: new Map(),
      settings: new Map(),
      history: new Map()
    };
    
    // 加载初始数据
    this.initData();
  }

  // --- 初始化逻辑 ---
  private initData() {
    // 1. 初始化纹身数据 (从 constants 加载)
    DEFAULT_TATTOOS.forEach(t => {
      this.db.tattoos.set(t.id, t);
    });

    // 2. 初始化默认设置
    const defaultSettings: SettingsTableItem = {
      id: 'default',
      language: Language.ZH_TW,
      deviceMode: DeviceMode.WEB,
      theme: Theme.LIGHT,
      apiCallCount: 0,
      userApiKey: null
    };
    this.db.settings.set('default', defaultSettings);

    // 3. 初始化默认用户
    this.db.users.set('guest', {
        id: 'guest',
        name: 'Guest User',
        apiCalls: 0
    });
  }

  // --- 通用 CRUD 接口 (模拟数据库操作) ---

  // 查询单条 (Select One)
  async get<T>(table: keyof DBSchema, id: string): Promise<T | null> {
    const map = this.db[table];
    if (!map) throw new Error(`Table ${table} does not exist`);
    
    const data = map.get(id);
    // 返回深拷贝数据，模拟数据库读取
    return data ? JSON.parse(JSON.stringify(data)) as T : null;
  }

  // 查询所有 (Select All)
  async getAll<T>(table: keyof DBSchema): Promise<T[]> {
    const map = this.db[table] as Map<string, any>;
    if (!map) throw new Error(`Table ${table} does not exist`);

    return new Promise((resolve) => {
      // 模拟 100-300ms 的网络/IO 延迟
      setTimeout(() => {
        const list = Array.from(map.values());
        resolve(JSON.parse(JSON.stringify(list)) as T[]);
      }, 150);
    });
  }

  // 创建数据 (Insert)
  async create<T extends { id: string }>(table: keyof DBSchema, data: T): Promise<T> {
    const map = this.db[table] as Map<string, any>;
    if (map.has(data.id)) {
      throw new Error(`Duplicate entry: ID ${data.id} already exists in ${table}`);
    }
    
    // 存入内存
    map.set(data.id, data);
    
    // 记录历史 (可选)
    this.recordHistory('create', table, data.id);
    
    return data;
  }

  // 更新数据 (Update)
  async update<T>(table: keyof DBSchema, id: string, data: Partial<T>): Promise<T | null> {
    const map = this.db[table] as Map<string, any>;
    const existing = map.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...data };
    map.set(id, updated);
    
    this.recordHistory('update', table, id);
    
    return JSON.parse(JSON.stringify(updated));
  }

  // 删除数据 (Delete)
  async delete(table: keyof DBSchema, id: string): Promise<boolean> {
    const map = this.db[table];
    if (map.delete(id)) {
      this.recordHistory('delete', table, id);
      return true;
    }
    return false;
  }

  // 条件查询 (Query) - 简单的 filter 实现
  async query<T>(table: keyof DBSchema, predicate: (item: T) => boolean): Promise<T[]> {
    const map = this.db[table] as Map<string, any>;
    const results: T[] = [];
    for (const item of map.values()) {
      if (predicate(item)) {
        results.push(JSON.parse(JSON.stringify(item)));
      }
    }
    return results;
  }

  // --- 辅助方法 ---

  private recordHistory(action: string, table: string, refId: string) {
    const id = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.db.history.set(id, {
      id,
      action,
      data: { table, refId },
      timestamp: Date.now()
    });
  }

  // File转Base64工具
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error("Base64 conversion failed"));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// 导出 MockDB 单例实例
export const mockDbInstance = new MockDB();