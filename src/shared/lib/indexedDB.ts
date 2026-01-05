const DB_NAME = "dataroom-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveFileToIndexedDB(
  userId: string,
  fileId: string,
  file: File,
): Promise<string> {
  const database = await initDB();
  const blobUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const key = `${userId}/${fileId}`;

    const fileData = {
      id: key,
      userId,
      fileId,
      blob: file,
      blobUrl,
      createdAt: Date.now(),
    };

    const request = store.put(fileData);

    request.onsuccess = () => resolve(blobUrl);
    request.onerror = () => reject(request.error);
  });
}

export async function getFileFromIndexedDB(
  userId: string,
  fileId: string,
): Promise<string | null> {
  const database = await initDB();
  const key = `${userId}/${fileId}`;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      if (result && result.blobUrl) {
        resolve(result.blobUrl);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFileFromIndexedDB(
  userId: string,
  fileId: string,
): Promise<void> {
  const database = await initDB();
  const key = `${userId}/${fileId}`;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllUserFiles(
  userId: string,
): Promise<Record<string, string>> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const result: Record<string, string> = {};
      const files = request.result as Array<{
        id: string;
        userId: string;
        fileId: string;
        blobUrl: string;
      }>;

      files.forEach((file) => {
        if (file.userId === userId) {
          result[file.fileId] = file.blobUrl;
        }
      });

      resolve(result);
    };
    request.onerror = () => reject(request.error);
  });
}
