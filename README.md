# HBuilderX 打包版本记录器

自动记录uni-app小程序打包版本信息的HBuilderX插件,支持自动版本号递增、智能信息记录。

## 功能特性

- ✅ 自动记录打包版本信息到`BUILD_HISTORY.md`和`.build-version.json`
- ✅ 自动递增版本号(versionCode和versionName)
- ✅ 自动更新`manifest.json`中的版本号
- ✅ 自动获取HBuilderX版本号
- ✅ 自动检测微信开发者工具版本号
- ✅ 自动使用系统登录用户名作为打包人员
- ✅ 支持快速记录和自定义记录两种模式
- ✅ 记住用户偏好设置(打包人员等)

## 安装方法

1. 将`hbuilderx-build-version-recorder`文件夹复制到HBuilderX插件目录:
   - Windows: `HBuilderX安装目录/plugins/`
   - Mac: `HBuilderX.app/Contents/HBuilderX/plugins/`

2. 重启HBuilderX

3. 插件激活后会显示提示信息

## 使用方法

### 方式一: 工具菜单

点击菜单栏【工具】→【记录打包版本信息】

### 方式二: 右键菜单

在编辑器中右键选择【记录打包版本信息】

### 快速记录模式(推荐)

1. 执行命令后,选择"快速记录"
2. 插件自动完成:
   - 版本号自动递增(如1.0.0→1.0.1)
   - versionCode自动+1
   - 使用系统用户名作为打包人员
   - 自动检测HBuilderX和微信开发者工具版本
   - 更新manifest.json
   - 记录到历史文件

### 自定义模式

1. 执行命令后,选择"自定义版本号"
2. 可以选择:
   - 修订号+1 (1.0.0→1.0.1)
   - 次版本号+1 (1.0.0→1.1.0)
   - 主版本号+1 (1.0.0→2.0.0)
   - 手动输入版本号
3. 可以修改打包人员(修改后会记住)
4. 可以添加备注信息

## 版本号规则

- **versionName**: 遵循语义化版本规范 (主版本号.次版本号.修订号)
  - 主版本号: 重大功能变更或不兼容的API修改
  - 次版本号: 新增功能,向下兼容
  - 修订号: bug修复,向下兼容
- **versionCode**: 每次打包自动递增的整数,用于版本比较

## 生成的文件

### BUILD_HISTORY.md

Markdown格式的打包历史记录表格,包含:

- 打包日期时间
- 小程序版本号
- versionCode
- HBuilderX版本
- 微信开发者工具版本
- 打包人员
- 备注信息

### .build-version.json

JSON格式的版本信息,包含:

- `lastBuild`: 最后一次打包信息
- `history`: 最近20次打包历史记录

### .build-config.json

用户配置文件,保存:

- 打包人员姓名偏好
- 其他用户自定义配置

## 查看打包历史

点击菜单栏【工具】→【查看打包历史】,或在编辑器右键选择【查看打包历史】

## 自动检测说明

### HBuilderX版本

通过`hx.env.appVersion`自动获取当前HBuilderX版本号

### 微信开发者工具版本

自动检测以下路径:

- `C:\Program Files (x86)\Tencent\微信web开发者工具`
- `C:\Program Files\Tencent\微信web开发者工具`
- `%LOCALAPPDATA%\Programs\微信web开发者工具`
- Windows注册表中的安装路径

读取`package.nw/package.json`获取版本号

### 打包人员

默认使用系统登录用户名(`%USERNAME%`),首次可以修改并保存偏好

## 最佳实践

1. **每次打包前记录**: 养成打包前先记录版本的习惯
2. **使用快速模式**: 日常打包使用快速记录,一键完成
3. **重要版本使用自定义**: 发布重要版本时使用自定义模式,添加详细备注
4. **版本号规范**: 遵循语义化版本规范,让版本号有意义
5. **提交到Git**: 将`BUILD_HISTORY.md`和`.build-version.json`提交到版本控制

## 注意事项

- 插件会自动修改`manifest.json`中的版本号
- `.build-config.json`包含个人配置,建议加入`.gitignore`
- 确保在uni-app项目根目录下使用(包含manifest.json的目录)

## 版本历史

### v1.0.0

- 初始版本发布
- 支持自动版本号递增
- 支持快速记录和自定义模式
- 自动检测HBuilderX和微信开发者工具版本
