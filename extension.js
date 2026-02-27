/**
 * HBuilderX 打包版本记录器插件
 * 自动记录uni-app小程序打包版本信息
 */

const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 插件激活入口
 */
function activate(context) {
    console.log('========================================');
    console.log('打包版本记录器插件已激活');
    console.log('========================================');
    
    hx.window.showInformationMessage('打包版本记录器插件已激活!');

    // 注册记录版本信息命令
    let recordCommand = hx.commands.registerCommand('extension.recordBuildVersion', async () => {
        try {
            await recordBuildVersion();
        } catch (error) {
            hx.window.showErrorMessage('记录版本信息失败: ' + error.message);
            console.error('记录版本信息失败:', error);
        }
    });

    // 注册查看打包历史命令
    let viewCommand = hx.commands.registerCommand('extension.viewBuildHistory', async () => {
        try {
            await viewBuildHistory();
        } catch (error) {
            hx.window.showErrorMessage('查看打包历史失败: ' + error.message);
            console.error('查看打包历史失败:', error);
        }
    });

    context.subscriptions.push(recordCommand);
    context.subscriptions.push(viewCommand);
}

/**
 * 记录打包版本信息
 */
async function recordBuildVersion() {
    // 获取当前工作区文件夹
    const workspaceFolders = hx.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        hx.window.showErrorMessage('请先打开一个项目');
        return;
    }

    // 查找manifest.json文件
    const projectPath = workspaceFolders[0].uri.fsPath;
    const manifestPath = path.join(projectPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
        hx.window.showErrorMessage('未找到manifest.json文件,请确保这是一个uni-app项目');
        return;
    }

    // 读取manifest.json
    const manifest = readManifestJson(manifestPath);
    if (!manifest) {
        hx.window.showErrorMessage('读取manifest.json失败');
        return;
    }

    // 读取用户配置和历史记录
    const userConfig = loadUserConfig(projectPath);
    const lastBuild = loadLastBuildInfo(projectPath);

    // 自动获取版本信息
    const hxVersion = await getHBuilderXVersion();
    const wechatVersion = await getWechatDevToolVersion();

    // 获取打包人员(优先级: 用户配置 > 系统用户名)
    let builderName = userConfig.builderName || getSystemUsername();

    // 自动计算新版本号
    const currentVersionName = manifest.versionName || '1.0.0';
    const currentVersionCode = parseInt(manifest.versionCode) || 100;
    
    const newVersionCode = currentVersionCode + 1;
    const newVersionName = incrementVersion(currentVersionName);

    // 询问用户是否需要修改默认行为
    const action = await hx.window.showQuickPick([
        {
            label: '快速记录',
            description: `版本: ${newVersionName} (${newVersionCode}), 打包人: ${builderName}`,
            value: 'quick'
        },
        {
            label: '自定义版本号',
            description: '修改版本号或打包人员信息',
            value: 'custom'
        }
    ], {
        placeHolder: '选择记录方式'
    });

    if (!action) {
        return; // 用户取消
    }

    let finalVersionName = newVersionName;
    let finalVersionCode = newVersionCode;
    let notes = '';

    if (action.value === 'custom') {
        // 自定义模式
        const versionChoice = await hx.window.showQuickPick([
            {
                label: '修订号+1',
                description: `${currentVersionName} → ${newVersionName}`,
                value: 'patch'
            },
            {
                label: '次版本号+1',
                description: `${currentVersionName} → ${incrementVersion(currentVersionName, 'minor')}`,
                value: 'minor'
            },
            {
                label: '主版本号+1',
                description: `${currentVersionName} → ${incrementVersion(currentVersionName, 'major')}`,
                value: 'major'
            },
            {
                label: '自定义版本号',
                description: '手动输入版本号',
                value: 'manual'
            }
        ], {
            placeHolder: '选择版本号变更方式'
        });

        if (!versionChoice) {
            return;
        }

        if (versionChoice.value === 'manual') {
            const customVersion = await hx.window.showInputBox({
                prompt: '请输入新版本号',
                value: newVersionName,
                placeHolder: '例如: 1.2.0'
            });
            if (!customVersion) {
                return;
            }
            finalVersionName = customVersion;
        } else {
            finalVersionName = incrementVersion(currentVersionName, versionChoice.value);
        }

        // 询问是否修改打包人员
        const changeBuilder = await hx.window.showQuickPick([
            {
                label: `使用当前: ${builderName}`,
                value: 'keep'
            },
            {
                label: '修改打包人员',
                value: 'change'
            }
        ], {
            placeHolder: '打包人员设置'
        });

        if (changeBuilder && changeBuilder.value === 'change') {
            const newBuilder = await hx.window.showInputBox({
                prompt: '请输入打包人员姓名',
                value: builderName,
                placeHolder: '例如: 张三'
            });
            if (newBuilder) {
                builderName = newBuilder;
                // 保存用户配置
                saveUserConfig(projectPath, { builderName });
            }
        }

        // 询问备注
        const inputNotes = await hx.window.showInputBox({
            prompt: '请输入本次打包备注(可选,直接回车跳过)',
            placeHolder: '例如: 修复登录bug'
        });
        notes = inputNotes || '';
    }

    // 构建版本信息
    const buildInfo = {
        date: getCurrentTime(),
        versionName: finalVersionName,
        versionCode: finalVersionCode.toString(),
        hbuilderVersion: hxVersion || '-',
        wechatDevToolVersion: wechatVersion || '-',
        builder: builderName,
        notes: notes || '常规打包'
    };

    // 更新manifest.json中的版本号
    updateManifestVersion(manifestPath, finalVersionName, finalVersionCode);

    // 更新BUILD_HISTORY.md
    updateBuildHistory(projectPath, buildInfo);

    // 更新.build-version.json
    updateBuildVersionJson(projectPath, buildInfo);

    hx.window.showInformationMessage(
        `✅ 版本信息记录成功!\n版本: ${buildInfo.versionName} (${buildInfo.versionCode})\n打包人: ${buildInfo.builder}\nHBuilderX: ${buildInfo.hbuilderVersion}\n微信开发者工具: ${buildInfo.wechatDevToolVersion}`
    );
}

/**
 * 查看打包历史
 */
async function viewBuildHistory() {
    const workspaceFolders = hx.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        hx.window.showErrorMessage('请先打开一个项目');
        return;
    }

    const projectPath = workspaceFolders[0].uri.fsPath;
    const historyPath = path.join(projectPath, 'BUILD_HISTORY.md');

    if (!fs.existsSync(historyPath)) {
        hx.window.showErrorMessage('未找到打包历史文件');
        return;
    }

    // 打开BUILD_HISTORY.md文件
    const document = await hx.workspace.openTextDocument(historyPath);
    await hx.window.showTextDocument(document);
}

/**
 * 读取manifest.json (支持带注释的JSON)
 */
function readManifestJson(manifestPath) {
    try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        // 移除注释
        const jsonContent = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
            .replace(/\/\/.*/g, ''); // 移除单行注释
        return JSON.parse(jsonContent);
    } catch (error) {
        console.error('读取manifest.json失败:', error);
        return null;
    }
}

/**
 * 获取当前时间
 */
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 获取系统用户名
 */
function getSystemUsername() {
    try {
        return process.env.USERNAME || process.env.USER || '未知用户';
    } catch (error) {
        console.error('获取系统用户名失败:', error);
        return '未知用户';
    }
}

/**
 * 加载用户配置
 */
function loadUserConfig(projectPath) {
    const configPath = path.join(projectPath, '.build-config.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (error) {
            console.error('读取用户配置失败:', error);
        }
    }
    return {};
}

/**
 * 保存用户配置
 */
function saveUserConfig(projectPath, config) {
    const configPath = path.join(projectPath, '.build-config.json');
    try {
        const existingConfig = loadUserConfig(projectPath);
        const newConfig = { ...existingConfig, ...config };
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (error) {
        console.error('保存用户配置失败:', error);
    }
}

/**
 * 加载上次构建信息
 */
function loadLastBuildInfo(projectPath) {
    const versionPath = path.join(projectPath, '.build-version.json');
    if (fs.existsSync(versionPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
            return data.lastBuild;
        } catch (error) {
            console.error('读取上次构建信息失败:', error);
        }
    }
    return null;
}

/**
 * 版本号递增
 * @param {string} version - 当前版本号 (如 "1.2.3")
 * @param {string} type - 递增类型: 'patch'(默认), 'minor', 'major'
 * @returns {string} 新版本号
 */
function incrementVersion(version, type = 'patch') {
    const parts = version.split('.').map(v => parseInt(v) || 0);
    
    // 确保至少有3个部分
    while (parts.length < 3) {
        parts.push(0);
    }
    
    switch (type) {
        case 'major':
            parts[0] += 1;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1] += 1;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2] += 1;
            break;
    }
    
    return parts.join('.');
}

/**
 * 更新manifest.json中的版本号
 */
function updateManifestVersion(manifestPath, versionName, versionCode) {
    try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        
        // 使用正则替换,保留注释和格式
        let newContent = content;
        
        // 替换versionName
        newContent = newContent.replace(
            /"versionName"\s*:\s*"[^"]*"/,
            `"versionName": "${versionName}"`
        );
        
        // 替换versionCode
        newContent = newContent.replace(
            /"versionCode"\s*:\s*"?\d+"?/,
            `"versionCode": "${versionCode}"`
        );
        
        fs.writeFileSync(manifestPath, newContent, 'utf-8');
        console.log(`manifest.json版本号已更新: ${versionName} (${versionCode})`);
    } catch (error) {
        console.error('更新manifest.json失败:', error);
        throw new Error('更新manifest.json失败: ' + error.message);
    }
}

/**
 * 获取HBuilderX版本
 */
async function getHBuilderXVersion() {
    try {
        // 通过hx.env获取版本信息
        if (hx.env && hx.env.appVersion) {
            return hx.env.appVersion;
        }
        return '未知版本';
    } catch (error) {
        console.error('获取HBuilderX版本失败:', error);
        return '未知版本';
    }
}

/**
 * 获取微信开发者工具版本
 */
async function getWechatDevToolVersion() {
    try {
        // 常见的微信开发者工具安装路径
        const possiblePaths = [
            'C:\\Program Files (x86)\\Tencent\\微信web开发者工具',
            'C:\\Program Files\\Tencent\\微信web开发者工具',
            path.join(process.env.LOCALAPPDATA || '', 'Programs', '微信web开发者工具'),
            path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', '微信web开发者工具')
        ];

        for (const basePath of possiblePaths) {
            // 尝试读取 package.nw/package.json
            const packagePath = path.join(basePath, 'package.nw', 'package.json');
            if (fs.existsSync(packagePath)) {
                try {
                    const packageContent = fs.readFileSync(packagePath, 'utf-8');
                    const packageJson = JSON.parse(packageContent);
                    if (packageJson.version) {
                        console.log('找到微信开发者工具版本:', packageJson.version);
                        return packageJson.version;
                    }
                } catch (err) {
                    console.error('读取微信开发者工具package.json失败:', err);
                }
            }
        }

        // 如果找不到,尝试通过注册表查找(Windows)
        if (process.platform === 'win32') {
            try {
                const regQuery = 'reg query "HKEY_CURRENT_USER\\Software\\Tencent\\微信web开发者工具" /v InstallDir';
                const result = execSync(regQuery, { encoding: 'utf-8' });
                const match = result.match(/InstallDir\s+REG_SZ\s+(.+)/);
                if (match && match[1]) {
                    const installDir = match[1].trim();
                    const packagePath = path.join(installDir, 'package.nw', 'package.json');
                    if (fs.existsSync(packagePath)) {
                        const packageContent = fs.readFileSync(packagePath, 'utf-8');
                        const packageJson = JSON.parse(packageContent);
                        if (packageJson.version) {
                            console.log('通过注册表找到微信开发者工具版本:', packageJson.version);
                            return packageJson.version;
                        }
                    }
                }
            } catch (err) {
                console.error('通过注册表查找微信开发者工具失败:', err);
            }
        }

        console.log('未找到微信开发者工具版本');
        return '未检测到';
    } catch (error) {
        console.error('获取微信开发者工具版本失败:', error);
        return '未检测到';
    }
}

/**
 * 更新BUILD_HISTORY.md
 */
function updateBuildHistory(projectPath, buildInfo) {
    const historyPath = path.join(projectPath, 'BUILD_HISTORY.md');
    
    // 如果文件不存在,创建初始文件
    if (!fs.existsSync(historyPath)) {
        const initialContent = `# 小程序打包版本记录

本文件记录每次使用HBuilderX打包小程序的版本信息,用于追踪打包历史和排查问题。

## 打包记录

| 打包日期 | 小程序版本 | versionCode | HBuilderX版本 | 微信开发者工具版本 | 打包人员 | 备注 |
|---------|-----------|-------------|--------------|------------------|---------|------|
| 示例: 2024-01-15 14:30 | 1.0.0 | 100 | 3.8.12 | 1.06.2401010 | 张三 | 初始版本 |

## 使用说明

通过HBuilderX菜单栏【工具】->【记录打包版本信息】来记录版本。
或者在编辑器中右键选择【记录打包版本信息】。

## 版本号规范

- **versionName**: 遵循语义化版本规范 (主版本号.次版本号.修订号)
- **versionCode**: 每次打包递增的整数,用于版本比较

## 自动获取的信息

- **HBuilderX版本**: 自动从HBuilderX环境中获取
- **微信开发者工具版本**: 自动从系统安装路径中检测
`;
        fs.writeFileSync(historyPath, initialContent, 'utf-8');
    }

    // 读取现有内容
    let content = fs.readFileSync(historyPath, 'utf-8');
    
    // 构建新记录行
    const newRow = `| ${buildInfo.date} | ${buildInfo.versionName} | ${buildInfo.versionCode} | ${buildInfo.hbuilderVersion} | ${buildInfo.wechatDevToolVersion} | ${buildInfo.builder} | ${buildInfo.notes} |`;
    
    // 在示例行后插入新记录
    const lines = content.split('\n');
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('示例:')) {
            insertIndex = i + 1;
            break;
        }
    }
    
    if (insertIndex > 0) {
        lines.splice(insertIndex, 0, newRow);
        content = lines.join('\n');
    } else {
        content += '\n' + newRow;
    }
    
    fs.writeFileSync(historyPath, content, 'utf-8');
}

/**
 * 更新.build-version.json
 */
function updateBuildVersionJson(projectPath, buildInfo) {
    const versionPath = path.join(projectPath, '.build-version.json');
    
    let versionData = {
        lastBuild: buildInfo,
        history: []
    };
    
    // 如果文件已存在,读取历史记录
    if (fs.existsSync(versionPath)) {
        try {
            const existingData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
            versionData.history = existingData.history || [];
            
            // 将上一次的构建信息加入历史记录
            if (existingData.lastBuild && existingData.lastBuild.date) {
                versionData.history.unshift(existingData.lastBuild);
                // 只保留最近20条历史记录
                versionData.history = versionData.history.slice(0, 20);
            }
        } catch (error) {
            console.error('读取.build-version.json失败:', error);
        }
    }
    
    versionData.lastBuild = buildInfo;
    
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2), 'utf-8');
}

/**
 * 插件停用
 */
function deactivate() {
    console.log('打包版本记录器插件已停用');
}

module.exports = {
    activate,
    deactivate
};
