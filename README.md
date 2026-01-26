# MinIO View

一个现代化的 MinIO 对象存储图库管理工具，专为个人图床打造。

![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## 为什么需要它？

使用 PicGo + MinIO 作为图床时，相册数据保存在本地，更换设备后历史图片列表会丢失。MinIO View 提供了一个 Web 界面，让你随时随地浏览和管理所有上传的文件。

## 功能特性

- **时间线视图** - 按日期自动分组，最新优先
- **图片预览** - 全屏预览，支持缩放、拖拽、键盘切换
- **无限滚动** - 分页加载，轻松处理海量文件
- **缩略图懒加载** - 按需加载，节省带宽
- **批量操作** - 多选、全选、批量删除
- **拖拽上传** - 支持多文件，自动按日期归档
- **安全存储** - AES 加密本地存储凭证
- **亚克力界面** - 现代毛玻璃视觉效果

## 快速开始

### 环境要求

- Node.js >= 16
- pnpm / npm / yarn
- MinIO 服务器

### 安装运行

```bash
# 克隆项目
git clone https://github.com/your-username/minio-view.git
cd minio-view

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:5174，配置 MinIO 连接信息即可使用。

### 构建部署

```bash
pnpm build
```

产物在 `dist` 目录，可部署到任何静态服务器。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite |
| UI | Element Plus |
| 样式 | SCSS |
| 存储 | AWS SDK v3 (S3 兼容) |
| 加密 | crypto-js |

## 项目结构

```
src/
├── layouts/        # 布局组件
├── views/          # 页面
│   ├── Gallery.vue # 图库（核心）
│   └── Settings.vue
├── services/       # MinIO 服务封装
├── utils/          # 工具函数
└── router/         # 路由配置
```

## 部署示例

### Docker

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```bash
docker build -t minio-view .
docker run -d -p 8080:80 minio-view
```

### Nginx

```nginx
server {
    listen 80;
    root /path/to/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 常见问题

**连接失败？**
- 检查 MinIO 地址、端口、密钥是否正确
- 确认网络可达，SSL 证书有效

**跨域问题？**
```bash
mc cors set minio/bucket --allow-origin="https://your-domain.com"
```

## 开发计划

### 文件预览增强

- [ ] PDF 在线预览
- [ ] Word 文档预览
- [ ] Excel 表格预览
- [ ] 音频文件在线播放
- [ ] 视频文件在线播放

### 功能增强

- [ ] 文件搜索与筛选
- [ ] 文件重命名
- [ ] 文件夹视图
- [ ] 生成分享链接
- [ ] 存储空间统计

### 体验优化

- [ ] 移动端适配优化
- [ ] 深色模式
- [ ] 国际化支持

## License

[MIT](LICENSE)

## 致谢

- [MinIO](https://min.io/)
- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
