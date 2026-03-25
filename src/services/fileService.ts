
import { authService } from './authService'

export interface ImportError {
  row: number;
  field: string;
  error: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    total: number;
    successCount: number;
    failCount: number;
    errors: ImportError[];
    warnings: any[];
  };
}

const ALLOWED_EXTS = ['xlsx', 'xls', 'csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Export farms data as a file blob.
 * POST /functions/v1/farm-file/export
 * Returns a Blob
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

async function parseErrorResponse(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function exportFarms(): Promise<Blob> {
  const token = await authService.getRequiredAccessToken();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/farm-file/export`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(authService.getProtectedActionErrorMessage(response.status, errorData?.error || '导出失败'));
  }

  return response.blob();
}

/**
 * Import farms data from a file.
 * POST /functions/v1/farm-file/import
 * Uses FormData with a single 'file' field.
 */
export async function importFarms(file: File): Promise<ImportResult> {
  const name = (file?.name || '').toLowerCase();
  const ext = name.split('.').pop() ?? '';
  if (!ALLOWED_EXTS.includes(ext)) {
    return {
      success: false,
      message: '只支持 .xlsx、.xls 和 .csv 格式的文件',
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: '文件大小不能超过10MB',
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = await authService.getRequiredAccessToken();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/farm-file/import`, {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return data.data ?? { success: true, message: '导入完成', data: { total: 0, successCount: 0, failCount: 0, errors: [], warnings: [] } };
    } else {
      return {
        success: false,
        message: authService.getProtectedActionErrorMessage(response.status, data?.error ?? '导入失败'),
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '导入失败: 系统异常',
    };
  }
}
