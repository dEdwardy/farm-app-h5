# 养殖场数据导入导出功能设计

## 概述

为 farm-app-h5 项目实现数据导入导出功能，参照 farm-app (RN) 版本实现，但简化实现。

## 技术栈

- React + Vite + Tailwind CSS + Supabase
- 复用 RN 版本后端 API（fileService.ts已存在）

## 文件结构

```
src/
├── components/
│   └── ImportExportModal.tsx    # 新建：导入导出模态框
└── pages/
    └── FarmList.tsx             # 修改：添加导入导出按钮
```

## API 端点

| 功能 | 方法 | 端点 | 请求格式 | 响应格式 |
|------|------|------|----------|----------|
| 导出 | POST | `/functions/v1/farm-file/export` | 无 | Blob (xlsx) |
| 导入 | POST | `/functions/v1/farm-file/import` | FormData | JSON |

## 组件设计

### ImportExportModal

- 模态框，带导入/导出标签页
- 支持文件选择（.xlsx, .xls, .csv）
- 显示导入进度和结果
- 导出时自动下载 xlsx 文件

### FarmList 集成

- 顶部标题栏右侧添加导入导出图标按钮
- 点击打开 ImportExportModal
- 导入成功后刷新列表

## 验收标准

- [ ] 可以选择 Excel/CSV 文件导入
- [ ] 导入后显示成功/失败统计
- [ ] 可以导出所有养殖场数据为 xlsx
- [ ] 导入成功后列表自动刷新
