import { StorageProvider } from './interface';
import { SupabaseStorage } from './supabase-storage';

// Тип хранилища
export enum StorageType {
  SUPABASE = 'supabase',
  // Можно добавить другие типы хранилищ в будущем
}

// Кэш экземпляров хранилищ
const storageInstances: Record<StorageType, StorageProvider | null> = {
  [StorageType.SUPABASE]: null,
};

/**
 * Фабрика для получения экземпляра хранилища
 */
export function getStorage(type: StorageType = StorageType.SUPABASE): StorageProvider {
  // Проверяем, есть ли уже созданный экземпляр
  if (storageInstances[type]) {
    return storageInstances[type]!;
  }
  
  // Создаем новый экземпляр в зависимости от типа
  switch (type) {
    case StorageType.SUPABASE:
      storageInstances[type] = new SupabaseStorage();
      break;
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
  
  return storageInstances[type]!;
}

// Экспортируем типы
export * from './interface';
export * from './supabase-storage'; 