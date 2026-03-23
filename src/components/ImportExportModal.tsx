import React, { useState } from 'react';
import { exportFarms, importFarms, ImportResult } from '../services/fileService';

interface ImportExportModalProps {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  visible,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImport = async (file: File) => {
    setIsLoading(true);
    setImportResult(null);
    try {
      const result = await importFarms(file);
      setImportResult(result);
      if (result.success) {
        onRefresh();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('导入失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const blob = await exportFarms();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `农场数据_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">数据导入导出</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3.5 font-medium text-sm transition-all duration-200 relative ${activeTab === 'import' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('import')}
          >
            导入
            {activeTab === 'import' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></span>
            )}
          </button>
          <button
            className={`flex-1 py-3.5 font-medium text-sm transition-all duration-200 relative ${activeTab === 'export' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('export')}
          >
            导出
            {activeTab === 'export' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></span>
            )}
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'import' ? (
            <div>
              <p className="text-gray-600 mb-4">选择 Excel/CSV 文件导入农场数据</p>
              <div 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary-300 transition-all duration-200"
                onClick={() => {
                  if (!isLoading) {
                    const input = document.getElementById('file-input-import') as HTMLInputElement;
                    input?.click();
                  }
                }}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-sm text-gray-500">导入中...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500">点击选择文件</span>
                    <span className="text-xs text-gray-400 mt-1">支持 .xlsx, .xls, .csv</span>
                  </>
                )}
                <input
                  id="file-input-import"
                  type="file"
                  accept=".xlsx,.xls,.csv,.application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                  }}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">导出所有农场数据为 Excel 文件</p>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-200 disabled:shadow-none disabled:translate-y-0 transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>导出中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>导出数据</span>
                  </>
                )}
              </button>
            </div>
          )}

          {importResult && (
            <div className={`mt-5 p-4 rounded-xl ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={importResult.success ? 'text-green-700' : 'text-red-700'}>{importResult.message}</p>
              {importResult.success && importResult.data && (
                <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{importResult.data.total}</p>
                    <p className="text-xs text-gray-500">总记录</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">{importResult.data.successCount}</p>
                    <p className="text-xs text-gray-500">成功</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-600">{importResult.data.failCount}</p>
                    <p className="text-xs text-gray-500">失败</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};