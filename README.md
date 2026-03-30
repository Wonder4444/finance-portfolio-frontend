# WealthWise - 极简财富管理系统

WealthWise 是一个基于 React 和 TypeScript 构建的现代化、极简主义财富管理系统。它旨在为用户提供清晰、直观的资产监控、市场分析及 AI 驱动的投资建议。

## 🚀 核心功能

1.  **自选列表 (Watchlist)**
    *   实时监控股票、加密货币和基金。
    *   展示价格波动、涨跌幅及趋势。
2.  **专业 K 线图 (Candlestick Charts)**
    *   集成 `lightweight-charts` 提供高性能的技术分析图表。
    *   支持多种资产类型的历史数据展示。
3.  **资产持有分析 (Portfolio)**
    *   可视化资产配置比例（饼图）。
    *   实时计算总资产、盈亏金额及收益率。
    *   详细的持仓列表管理。
4.  **市场时间线 (Market Timeline)**
    *   今日金融重要新闻事件流。
    *   根据事件影响（正面、负面、中性）进行视觉标注。
5.  **AI 投资顾问 (AI Advisor)**
    *   基于 Google Gemini 3.0 的智能对话系统。
    *   支持讨论投资策略、分析资产走势及获取市场洞察。

## 🛠️ 技术栈

*   **前端框架**: React 19 + TypeScript
*   **样式处理**: Tailwind CSS (极简风格，磨砂玻璃效果)
*   **图表库**: 
    *   `lightweight-charts` (K 线图)
    *   `recharts` (资产配置饼图)
*   **AI 集成**: `@google/genai` (Gemini API)
*   **图标**: `lucide-react`
*   **动画**: `motion`
*   **构建工具**: Vite

## 📂 项目结构

```text
src/
├── components/          # UI 组件
│   ├── AIChat.tsx       # AI 对话界面
│   ├── CandlestickChart.tsx # K 线图组件
│   ├── NewsTimeline.tsx # 新闻时间线
│   ├── Portfolio.tsx    # 资产概览
│   └── Watchlist.tsx    # 自选列表
├── lib/                 # 工具库
│   ├── gemini.ts        # AI 服务配置
│   └── utils.ts         # 通用工具函数
├── types.ts             # TypeScript 类型定义
├── App.tsx              # 主布局与路由逻辑
├── index.css            # 全局样式与 Tailwind 配置
└── main.tsx             # 应用入口
```

## 🛠️ 开发指南

### 环境变量配置

在 `.env` 文件中配置以下变量：

```env
GEMINI_API_KEY=你的_GEMINI_API_KEY
```

### 运行项目

1.  **安装依赖**:
    ```bash
    npm install
    ```
2.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
3.  **构建生产版本**:
    ```bash
    npm run build
    ```

## 🎨 设计规范

*   **风格**: 极简主义、专业工具感。
*   **配色**: 深色背景 (`#0a0a0a`)，搭配高对比度的文字 (`#f5f5f5`)。
*   **视觉**: 避免大面积渐变，使用磨砂玻璃 (`backdrop-blur`) 增加层次感。
*   **形状**: 减少圆角使用，强调硬朗、精准的线条。

---

*WealthWise - 助你明智理财。*
