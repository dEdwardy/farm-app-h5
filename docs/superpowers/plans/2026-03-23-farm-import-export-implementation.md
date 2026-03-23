# 养殖场数据导入导出功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在farm-app-h5项目中实现简单的农场数据导入导出功能，参照RN项目的实现但简化UI。

**Architecture:** 在FarmList页面添加导入导出按钮，创建简单的Modal组件，复用现有的fileService服务。

**Tech Stack:** React + Vite + Tailwind CSS + Supabase + 现有的fileService

---

## 文件结构

### 需要创建的文件
- `src/components/ImportExportModal.tsx` - 导入导出模态框组件

### 需要修改的文件
- `src/pages/FarmList.tsx` - 添加导入导出按钮和状态管理

### 现有文件复用
- `src/services/fileService.ts` - 已有导入导出功能
- `src/types/farm.ts` - 农场数据类型

---

## 任务分解

### Task 1: 创建 ImportExportModal 组件

**文件:**
- Create: `src/components/ImportExportModal.tsx`

- [ ] **Step 1: 创建基础组件结构**

创建组件文件，定义props接口和基础结构：

```typescript
import React, { useState } from 'react';
import { fileService, ImportResult } from '../services/fileService';

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

  // 处理导入
  const handleImport = async (file: File) => {
    setIsLoading(true);
    setImportResult(null);
    try {
      const result = await fileService.importFarms(file);
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

  // 处理导出
  const handleExport = async () => {
    setIsLoading(true);
    try {
      const blob = await fileService.exportFarms();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-md">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">数据导入导出</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 ${activeTab === 'import' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('import')}
          >
            导入
          </button>
          <button
            className={`flex-1 py-3 ${activeTab === 'export' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('export')}
          >
            导出
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4">
          {activeTab === 'import' ? (
            <div>
              <p className="text-gray-600 mb-4">选择 Excel/CSV 文件导入农场数据</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">导出所有农场数据为 Excel 文件</p>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {isLoading ? '导出中...' : '导出数据'}
              </button>
            </div>
          )}

          {/* 结果显示 */}
          {importResult && (
            <div className={`mt-4 p-3 rounded ${importResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p>{importResult.message}</p>
              {importResult.success && importResult.data && (
                <div className="mt-2 text-sm">
                  <p>总记录数: {importResult.data.total}</p>
                  <p>成功: {importResult.data.successCount}</p>
                  <p>失败: {importResult.data.failCount}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 验证组件编译**

运行 TypeScript 检查确保组件没有类型错误：

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 3: 提交组件**

```bash
git add src/components/ImportExportModal.tsx
git commit -m "feat: add ImportExportModal component for farm import/export"
```

### Task 2: 修改 FarmList 页面添加导入导出按钮

**文件:**
- Modify: `src/pages/FarmList.tsx`

- [ ] **Step 1: 添加导入导出按钮到页面头部**

在 FarmList 页面的标题区域添加两个按钮：

```typescript
// 在标题部分添加按钮
<div className="bg-primary-500 text-white px-4 py-4 flex-shrink-0">
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-xl font-bold">养殖场列表</h1>
      <p className="text-primary-100 text-sm mt-1">
        {farms.length > 0 ? `共 ${farms.length} 个养殖场` : '管理您的养殖场'}
      </p>
    </div>
    <div className="flex space-x-2">
      <button
        onClick={() => setShowImportExport(true)}
        className="bg-primary-600 hover:bg-primary-700 px-3 py-1 rounded text-sm"
      >
        导入
      </button>
      <button
        onClick={() => setShowImportExport(true)}
        className="bg-primary-600 hover:bg-primary-700 px-3 py-1 rounded text-sm"
      >
        导出
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: 添加状态管理和导入导入组件**

在组件中添加状态管理和导入的组件：

```typescript
// 在组件顶部添加状态
const [showImportExport, setShowImportExport] = useState(false);

// 在组件返回部分添加Modal
return (
  <div className="h-full flex flex-col bg-gray-50">
    {/* 现有内容 */}
    
    {/* 导入导出弹窗 */}
    <ImportExportModal
      visible={showImportExport}
      onClose={() => setShowImportExport(false)}
      onRefresh={() => fetchFarms(true, 1)}
    />
  </div>
);
```

- [ ] **Step 3: 添加导入语句**

在文件顶部添加导入：

```typescript
import { ImportExportModal } from '../components/ImportExportModal';
```

- [ ] **Step 4: 验证页面功能**

确保页面正常编译和运行：

```bash
npm run build
```

预期：构建成功

- [ ] **Step 5: 提交修改**

```bash
git add src/pages/FarmList.tsx
git commit -m "feat: add import/export buttons to FarmList page"
```

### Task 3: 功能测试和验证

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

预期：服务器正常启动

- [ ] **Step 2: 测试导入功能**

1. 访问农场列表页面
2. 点击"导入"按钮
3. 选择有效的Excel/CSV文件
4. 验证导入结果正确显示

- [ ] **Step 3: 测试导出功能**

1. 点击"导出"按钮
2. 验证文件下载成功
3. 验证下载的文件可以正常打开

- [ ] **Step 4: 测试错误情况**

1. 尝试导入无效文件格式
2. 验证错误消息正确显示
3. 验证界面状态恢复正常

- [ ] **Step 5: 最终提交**

```bash
git add .
git commit -m "test: verify import/export functionality works correctly"
```

---

## 验证标准

### 功能验证
- [ ] 导入按钮正常工作
- [ ] 导出按钮正常工作
- [ ] 文件选择器正确过滤文件类型
- [ ] 导入结果正确显示
- [ ] 导出文件正确下载
- [ ] 导入成功后列表自动刷新
- [ ] 错误处理正确

### 用户体验验证
- [ ] 按钮位置合理，易于发现
- [ ] 加载状态正确显示
- [ ] 错误消息清晰易懂
- [ ] Modal关闭功能正常

### 代码质量验证
- [ ] TypeScript无类型错误
- [ ] ESLint无错误
- [ ] 代码符合项目规范
- [ ] 组件职责清晰

---

## 注意事项

1. **复用现有服务**：直接使用已有的`fileService.importFarms`和`fileService.exportFarms`函数
2. **简化实现**：跳过复杂的进度显示，只显示基本加载状态
3. **错误处理**：使用简单的try-catch和用户提示
4. **样式一致性**：使用项目现有的Tailwind CSS类
5. **响应式设计**：确保在移动设备上正常工作

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-03-23-farm-import-export-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**