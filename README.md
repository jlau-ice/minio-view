# MinIO View

一个基于 Vue 3 的 MinIO 对象存储图床管理工具，专为个人图床管理打造，支持文件预览、批量操作、按时间线展示等功能。

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [安装和运行](#安装和运行)
- [使用指南](#使用指南)
- [配置说明](#配置说明)
- [部署指南](#部署指南)
- [常见问题](#常见问题)
- [开发](#开发)
- [贡献指南](#贡献指南)
- [路线图](#路线图)
- [许可证](#许可证)
- [联系方式](#联系方式)
- [致谢](#致谢)

## 项目简介

MinIO View 是一个轻量级的前端应用，用于管理和查看 MinIO 对象存储中的文件。特别适合使用 PicGo + MinIO 作为图床的用户，解决了更换设备后无法查看历史上传图片的问题。

### 为什么创建这个项目？

使用 PicGo + MinIO 作为图床时，虽然图片存储在 MinIO 服务器上，但 PicGo 的相册数据保存在本地。更换设备后，历史上传的图片列表会丢失，虽然文件还在服务器上，但无法方便地浏览和管理。

MinIO View 提供了一个基于 Web 的图库界面，可以：
- 按时间线查看所有上传的文件
- 预览图片和其他文件
- 批量管理文件
- 直接上传新文件
- 随时随地访问，不依赖本地设备

## 功能特性

### 核心功能

- **安全配置管理**
  - MinIO 凭证使用 AES 加密存储在浏览器本地
  - 支持连接测试
  - 可随时修改或清除配置

- **时间线视图**
  - 按日期自动分组展示文件
  - 最新文件优先显示
  - 显示文件数量统计

- **文件预览**
  - 图片大图预览
  - 非图片文件在新窗口打开
  - 支持多种文件类型识别（图片、PDF、视频、音频、文档等）

- **文件上传**
  - 支持拖拽上传
  - 支持多文件同时上传
  - 自动按 `年/月/日/时间戳_文件名` 格式存储
  - 例如：`2026/01/17/1737202800000_image.jpg`

- **批量操作**
  - 批量选择文件
  - 全选/取消全选
  - 批量删除
  - 显示选中数量

- **文件管理**
  - 单文件删除
  - 文件下载
  - 文件大小显示
  - 上传时间显示

### 界面特性

- 现代化卡片设计
- 响应式布局，自适应屏幕大小
- 悬停动画效果
- 选中状态高亮
- 图片缩略图加载
- 文件类型图标展示

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Element Plus
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: SCSS + Tailwind CSS
- **MinIO SDK**: AWS SDK for JavaScript v3
- **加密**: crypto-js

## 快速开始

### 前置条件

在使用 MinIO View 之前，请确保：

1. 已安装并运行 MinIO 服务器
2. 拥有 MinIO 的 Access Key 和 Secret Key
3. 已创建至少一个存储桶（Bucket）

### 快速体验

```bash
# 克隆项目
git clone https://github.com/your-username/minio-view.git
cd minio-view

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:5174`，在设置页面填入你的 MinIO 配置即可开始使用。

## 安装和运行

### 环境要求

- Node.js >= 16
- pnpm（推荐）或 npm

### 安装步骤

1. 克隆项目

```bash
git clone <your-repo-url>
cd minio-view
```

2. 安装依赖

```bash
pnpm install
# 或
npm install
```

3. 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

4. 访问应用

打开浏览器访问: `http://localhost:5174`

### 构建生产版本

```bash
pnpm build
# 或
npm run build
```

构建产物在 `dist` 目录下，可以部署到任何静态服务器。

## 使用指南

### 首次使用

1. **配置 MinIO 连接**
   - 首次访问会自动跳转到设置页面
   - 填写 MinIO 服务器信息：
     - 服务地址（不带 http://）
     - 端口号（默认 9000）
     - 是否使用 SSL
     - Access Key
     - Secret Key
   - 点击"测试连接"确保配置正确
   - 点击"保存配置"

2. **选择存储桶**
   - 在图库页面顶部选择要查看的桶（Bucket）
   - 文件列表会自动加载

### 日常使用

#### 查看文件
- 文件按日期分组，最新的在最上面
- 点击图片可以放大预览
- 非图片文件点击后在新窗口打开

#### 上传文件
1. 点击"上传文件"按钮
2. 拖拽文件到上传区域或点击选择
3. 可以一次选择多个文件
4. 点击"开始上传"

**注意**: 文件会按照 `年/月/日/时间戳_原文件名` 的格式自动命名和分类存储。

#### 删除文件

**单个删除**:
- 鼠标悬停在文件卡片上
- 点击红色删除按钮
- 确认删除

**批量删除**:
1. 点击"批量选择"按钮
2. 点击文件卡片选中（可点击"全选"）
3. 点击"删除选中 (数量)"按钮
4. 确认删除
5. 点击"取消"退出批量模式

#### 下载文件
- 鼠标悬停在文件卡片上
- 点击绿色下载按钮

### 更换配置
- 点击顶部导航栏的"设置"
- 修改 MinIO 连接信息
- 保存新配置

## 配置说明

### MinIO 服务器配置

- **服务地址**: MinIO 服务器的 IP 或域名，不需要加 `http://` 或 `https://`
  - 示例: `192.168.1.100` 或 `minio.example.com`

- **端口**: MinIO 服务端口
  - 默认: `9000`
  - HTTPS 默认: `443`

- **使用 SSL**: 是否通过 HTTPS 连接
  - 开启后会使用 `https://` 协议
  - 关闭则使用 `http://` 协议

- **Access Key**: MinIO 访问密钥

- **Secret Key**: MinIO 密钥

### 安全说明

- 所有凭证使用 AES 加密后存储在浏览器 `localStorage` 中
- 凭证不会上传到任何服务器
- 建议定期更换密钥
- 不建议在公共电脑上使用，使用完毕后可在设置页面清除配置

## 文件存储结构

上传的文件会按照以下结构存储在 MinIO 中：

```
bucket-name/
├── 2026/
│   ├── 01/
│   │   ├── 17/
│   │   │   ├── 1737202800000_image1.jpg
│   │   │   ├── 1737202801234_screenshot.png
│   │   │   └── 1737202802567_document.pdf
│   │   ├── 18/
│   │   │   └── ...
│   └── 02/
│       └── ...
└── 2025/
    └── ...
```

这种结构的优势：
- 便于按日期查找
- 时间戳避免文件名冲突
- 保留原始文件名
- 符合图床使用习惯

## 浏览器兼容性

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14

## 常见问题

### 1. 连接测试失败？

检查以下几点：
- MinIO 服务器是否运行正常
- 服务地址和端口是否正确
- Access Key 和 Secret Key 是否正确
- 网络是否可达
- 如果使用 SSL，确保证书有效

### 2. 图片加载缓慢？

- 图片加载使用预签名 URL，速度取决于网络和 MinIO 服务器性能
- 建议在局域网环境使用以获得最佳性能

### 3. 文件上传失败？

- 检查文件大小是否超过 MinIO 限制
- 检查桶是否有写入权限
- 查看浏览器控制台错误信息

### 4. 更换设备后如何继续使用？

- 在新设备的浏览器中重新配置 MinIO 连接信息
- 所有文件都存储在 MinIO 服务器上，不会丢失

## 部署指南

### 静态网站部署

MinIO View 是纯前端应用，可以部署到任何静态网站托管服务。

#### 构建应用

```bash
pnpm build
```

构建产物在 `dist` 目录下，包含所有静态文件。

#### 部署选项

**1. Nginx 部署**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/minio-view/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**2. Apache 部署**

在 `dist` 目录创建 `.htaccess` 文件：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**3. Docker 部署**

创建 `Dockerfile`：

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建并运行：

```bash
docker build -t minio-view .
docker run -d -p 8080:80 minio-view
```

**4. 其他平台**

- **Vercel**: 导入 Git 仓库，自动检测 Vite 项目并部署
- **Netlify**: 拖拽 `dist` 目录或连接 Git 仓库
- **GitHub Pages**: 使用 GitHub Actions 自动构建部署
- **云服务器**: 上传 `dist` 目录到服务器，配置 Web 服务器

### 环境变量配置

由于是纯前端应用，所有配置在浏览器端完成，无需环境变量。

### CORS 注意事项

如果遇到跨域问题，需要在 MinIO 服务器上配置 CORS：

```bash
mc cors set minio/your-bucket --allow-origin="https://your-domain.com"
```

或在 MinIO 控制台的 Bucket 设置中配置允许的源。

## 开发

### 项目结构

```
minio-view/
├── src/
│   ├── assets/          # 静态资源
│   ├── layouts/         # 布局组件
│   │   └── components/  # Header 等公共组件
│   ├── router/          # Vue Router 路由配置
│   ├── services/        # MinIO 服务封装
│   ├── store/           # Pinia 状态管理
│   ├── utils/           # 工具函数（加密、格式化等）
│   ├── views/           # 页面组件
│   │   ├── Gallery.vue  # 图库页面（主要功能）
│   │   └── Settings.vue # 设置页面
│   ├── App.vue          # 根组件
│   └── main.ts          # 应用入口
├── public/              # 公共静态资源
├── package.json         # 项目依赖配置
├── vite.config.ts       # Vite 构建配置
├── tsconfig.json        # TypeScript 配置
└── tailwind.config.js   # Tailwind CSS 配置
```

### 核心模块说明

**MinIO 服务 (`src/services/minio.ts`)**
- 封装 MinIO 客户端操作
- 提供文件上传、下载、删除等方法
- 处理预签名 URL 生成

**配置管理 (`src/store/config.ts`)**
- 使用 Pinia 管理 MinIO 配置
- AES 加密/解密凭证
- 持久化到 localStorage

**文件管理 (`src/views/Gallery.vue`)**
- 文件列表获取和展示
- 批量选择和操作
- 时间线分组逻辑

### 开发建议

**代码规范**
- 使用 TypeScript 确保类型安全
- 遵循 Vue 3 Composition API 最佳实践
- 组件样式使用 SCSS Scoped
- 优先使用 Tailwind CSS 工具类

**性能优化**
- 图片懒加载使用预签名 URL
- 大列表使用虚拟滚动（可扩展）
- 合理使用 Vue 的响应式特性

**调试技巧**
```bash
# 启动开发服务器（带热更新）
pnpm dev

# 类型检查
pnpm type-check

# 构建预览
pnpm build && pnpm preview
```

### 技术亮点

1. **安全性**: 客户端 AES 加密存储凭证
2. **用户体验**: 响应式设计，拖拽上传，批量操作
3. **性能**: Vite 构建，按需加载，预签名 URL
4. **架构**: 纯前端应用，无后端依赖，易于部署

## 贡献指南

欢迎提交 Issue 和 Pull Request！

**贡献流程**
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

**开发规范**
- 保持代码风格一致
- 添加必要的注释
- 确保类型安全
- 测试新功能

## 路线图

- [ ] 添加视频/音频预览播放器
- [ ] 支持文件重命名和移动
- [ ] 添加文件搜索和筛选功能
- [ ] 支持多桶同时管理
- [ ] 添加统计面板（存储空间、文件数量等）
- [ ] 支持分享文件（生成临时链接）
- [ ] 支持文件夹结构展示
- [ ] 移动端优化

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/your-username/minio-view/issues)
- 发起 [Pull Request](https://github.com/your-username/minio-view/pulls)

## 致谢

- [MinIO](https://min.io/) - 高性能对象存储
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - JavaScript SDK
