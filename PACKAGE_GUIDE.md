# 插件打包和提交指南

## 📦 打包方法

根据官方文档要求,HBuilderX插件压缩包结构为:**打开zip后根目录需为插件id目录**

### 正确的压缩包结构

```
sparksleo-verrec.zip
└── sparksleo-verrec/          ← 插件ID目录(必须)
    ├── package.json            ← 插件配置
    ├── extension.js            ← 插件代码
    ├── README.md              ← 使用说明
    ├── LICENSE                ← 开源协议
    └── .gitignore             ← Git配置
```

### Windows打包命令

```powershell
# 方法1: 使用PowerShell (推荐)
cd D:\Development\WorkProject\sp.core
Compress-Archive -Path sparksleo-verrec -DestinationPath sparksleo-verrec.zip -Force

# 方法2: 使用7-Zip命令行
cd D:\Development\WorkProject\sp.core
7z a -tzip sparksleo-verrec.zip sparksleo-verrec\
```

### 手动打包步骤

1. 进入`D:\Development\WorkProject\sp.core`目录
2. 右键点击`sparksleo-verrec`文件夹
3. 选择"发送到" → "压缩(zipped)文件夹"
4. 确认生成的文件名为`sparksleo-verrec.zip`

### 验证压缩包

解压`sparksleo-verrec.zip`后应该看到:

```
sparksleo-verrec/              ← 第一层必须是插件ID目录
├── package.json
├── extension.js
├── README.md
├── LICENSE
└── .gitignore
```

**错误示例(不要这样):**

```
sparksleo-verrec.zip
├── package.json               ← ❌ 错误!文件直接在根目录
├── extension.js
└── ...
```

## 📝 提交信息

### 基本信息

- **分类**: HBuilderX
- **插件ID**: `sparksleo-verrec` (19字符,符合规范)
- **作者ID**: `sparksleo`
- **插件名称**: `verrec`
- **标签**: `版本管理, 打包记录, uni-app, 小程序, 版本号, 自动化`

### 更新日志(v1.0.0)

```markdown
- 支持自动记录uni-app小程序打包版本信息
- 自动递增版本号(versionCode和versionName)
- 自动更新manifest.json中的版本号
- 自动获取HBuilderX版本号
- 自动检测微信开发者工具版本号
- 自动使用系统登录用户名作为打包人员
- 提供快速记录和自定义记录两种模式
- 记住用户偏好设置
- 生成Markdown和JSON格式的打包历史
```

### 权限说明

**1. 系统权限列表:**

```
文件系统读写权限
```

**2. 数据采集说明:**

```
插件不采集任何数据。

插件仅在本地读取和写入文件,包括:
- 读取项目的manifest.json文件获取版本信息
- 读取系统环境变量获取用户名(仅用于本地记录)
- 读取微信开发者工具安装目录获取版本号(仅用于本地记录)
- 在项目目录下生成BUILD_HISTORY.md、.build-version.json、.build-config.json文件

所有数据均保存在用户本地,不会上传到任何服务器。
```

**3. 广告说明:**

```
无
```

### 插件使用说明

复制`README.md`的完整内容到插件市场的"插件使用说明"字段。

## ✅ 提交前检查清单

- [ ] 插件ID为`sparksleo-verrec`(只包含英文和数字,无下划线)
- [ ] package.json中name字段为`sparksleo-verrec`
- [ ] package.json中publisher字段为`sparksleo`
- [ ] 压缩包为标准zip格式
- [ ] 压缩包结构正确(根目录为插件ID目录)
- [ ] 不包含node_modules目录
- [ ] 不包含unpackage目录
- [ ] 不包含.git等版本控制文件
- [ ] LICENSE文件已包含
- [ ] README.md内容完整

## 🚀 提交流程

1. **重命名插件目录**: 将`sparksleo-ver_rec`重命名为`sparksleo-verrec`
2. 登录DCloud插件市场: https://ext.dcloud.net.cn/
3. 进入"我的插件"
4. 点击"发布插件"
5. 选择分类: HBuilderX
6. 填写插件ID: `sparksleo-verrec`
7. 填写标签和更新日志
8. 上传插件包: `sparksleo-verrec.zip`
9. 填写权限和数据采集说明
10. 复制README.md内容到"插件使用说明"
11. 提交审核

## 📌 注意事项

1. **插件ID命名规范**: 只能包含英文和数字,不能包含下划线、中划线等特殊字符(中划线`-`用于分隔作者ID和插件名)
2. **HBuilderX插件需要审核**,提交后等待DCloud管理员审核
3. **压缩包必须是标准zip格式**,不要使用rar等其他格式
4. **插件ID一旦确定不能修改**,请确认无误后再提交
5. **插件不能自行下架**,如需下架请发邮件到service@dcloud.io

## 📞 技术支持

- 插件市场官方QQ群: 442089584
- 邮箱: service@dcloud.io
- 官方文档: https://uniapp.dcloud.net.cn/plugin/publish.html
