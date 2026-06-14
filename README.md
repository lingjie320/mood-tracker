# 心情记录 🌈

一个轻量的心情日记 PWA。记录每天的心情（开心 / 平常 / 伤心），可加一句话备注，附带日历视图和时段统计。

**所有数据保存在你自己的设备上（localStorage），不会上传到任何服务器。**

## 立即使用

👉 **https://lingjie320.github.io/mood-tracker/**

> 用手机浏览器打开上面的链接，然后在浏览器菜单里选「添加到主屏幕」，就能像 App 一样离线使用了。

## 功能

- 😊😐😢 **三种心情**：开心 / 平常 / 伤心
- 📝 **文字备注**：开心或伤心时，可加一句话描述原因
- 📅 **月历视图**：颜色一眼看出每天的心情，带备注的日子有 📝 标记
- 📊 **时段统计**：自定义起止日期，统计开心 / 平常 / 伤心天数与占比
- 📜 **历史记录**：完整列表，可按心情或"有备注"筛选
- 📱 **手机优先**：触控目标 ≥ 44px，适配 iOS 安全区
- 📦 **可安装 PWA**：添加到主屏幕后离线可用

## 技术

纯静态文件，无后端，无依赖：

- HTML / CSS / 原生 JavaScript
- localStorage 存数据
- Service Worker + Web App Manifest → 可安装 PWA
- 部署在 GitHub Pages

## 本地开发

```bash
# 启动本地服务器（任选其一）
python3 -m http.server 8080
# 或
npx serve .

# 然后浏览器打开 http://localhost:8080
```

## 打包成桌面 App（可选）

项目自带 `build.sh`，需要 [Pake](https://github.com/tw93/Pake)：

```bash
cargo install pake-cli
./build.sh
```

## 文件结构

```
.
├── index.html         # 入口
├── style.css          # 样式
├── app.js             # 业务逻辑
├── manifest.json      # PWA 清单
├── sw.js              # Service Worker
├── icons/             # PWA 图标
├── build.sh           # Pake 打包脚本
└── README.md
```

## 隐私

- 没有服务器，没有账号
- 所有数据仅存在你自己手机的浏览器 localStorage 里
- 清除浏览器数据 = 清空所有记录
- 卸载 PWA 也会清空

## License

MIT
