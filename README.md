# AFRC 网页端正式发布包

该目录是按 `miniprogram/pages/afrc/` 复刻的网页端正式发布包，目标是尽量保持与小程序一致的：

- 深色主题
- 卡片顺序
- 参数滑块
- 状态区
- 底部 `Read / Write / Default` 按钮
- BLE 指令协议

该页面本身是纯静态站点，可以直接部署到支持 `HTTPS` 的静态托管平台，推荐 `Cloudflare Pages`。

## 启动方法

Web Bluetooth 不能在普通 `file://` 页面下工作，请使用 `localhost` 或 `https` 打开。

在项目根目录执行：

```powershell
py -m http.server 8000
```

然后访问：

```text
http://localhost:8000/BLE-AFRC/web_prototype/index.html
```

## 浏览器要求

- 推荐桌面端：最新版 `Chrome` 或 `Edge`
- 推荐手机端：`安卓 Chrome`
- `iPhone / iPad` 浏览器目前通常不支持 `Web Bluetooth`
- 手机端也必须通过 `https` 正式链接打开
- 需要设备已开启蓝牙
- 需要通过浏览器弹出的原生设备选择器手动选择 `AFRC_BLE_Servo`

## 正式发布推荐

推荐使用 `Cloudflare Pages`，原因：

- 免费
- 自动提供 `https`
- 不需要自己维护服务器
- 对客人来说就是一个普通网页链接
- 后续可以绑定你自己的正式域名

最简单的发布方式：

1. 登录 Cloudflare
2. 打开 `Workers & Pages`
3. 创建 `Pages` 项目
4. 选择 `Direct Upload`
5. 上传当前 `web_prototype` 目录全部文件
6. 发布后会得到一个 `https://xxxx.pages.dev/` 链接
7. 将这个正式链接填入 `miniprogram/config/web.js` 的 `officialUrl`

## 目录内与正式发布相关的文件

- `index.html`：网页入口
- `app.js`：BLE 通信与界面逻辑
- `styles.css`：样式
- `site.webmanifest`：手机浏览器安装与站点信息
- `_headers`：给 Cloudflare Pages 用的响应头配置，显式允许蓝牙能力

## 与小程序的一个差异

微信小程序可以自己列出扫描结果；标准 Web Bluetooth 主要依赖浏览器原生选择器，因此网页端的“扫描连接”按钮会唤起浏览器设备选择弹窗，而不是完全自己渲染扫描列表。这是浏览器安全模型限制，不是协议问题。

## 名字策略

网页端只显示 `Servo Name`，不提供改名入口，保持厂家定义。
