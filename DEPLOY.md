# GitHub Pages 部署

这个项目是纯前端 Vite 站点，可以部署到 GitHub Pages。

## 本地构建

```bash
npm install
npm run build
```

构建产物在 `dist/`。`vite.config.js` 已经设置 `base: "./"`，适配 GitHub Pages 的仓库子路径。

## 推荐部署方式

1. 在 GitHub 新建仓库并推送 `thuee-simulator` 目录内容。
2. 进入仓库 `Settings -> Pages`。
3. Source 选择 `GitHub Actions`。
4. 推送到 `main` 分支后，仓库内置的 `.github/workflows/deploy.yml` 会自动构建并发布。

也可以直接把 `dist/` 目录发布到 Pages 分支或任意静态托管平台。
