# inko 墨可

面向公众号创作者的 AI 内容创作工作台。当前已完成首页看板、统计可视化、明暗主题和本地草稿管理，AI 服务尚未接入。

## 本地开发

```sh
pnpm install
pnpm dev
```

访问 http://localhost:3000。

```sh
pnpm build
pnpm start
```

## 项目结构

- `app/`：页面入口、布局和全局样式
- `components/ui/`：通用界面组件
- `components/dashboard/`：看板和图表组件
- `lib/`：数据模型和统计计算

看板提供示例数据与本机数据两种模式。本机草稿保存在浏览器 localStorage 中，不会自动同步到其他设备。

`reference/` 为本地设计参考目录，已排除在 Git 版本控制之外。
