# CLAUDE.md - EtherCAT TaskEditor 项目指南

## 项目概述

EtherCAT TaskEditor 是一个基于 Vue 2 的 Web 应用，用于配置 EtherCAT 从站模块并生成对应的 `config.yaml` 配置文件。该配置文件供 [EcatV2_Master](https://github.com/AIMEtherCAT/EcatV2_Master) 使用。

## 技术栈

- **框架**: Vue 2.6 (Options API)
- **UI 库**: Element UI 2.x
- **构建工具**: Vue CLI 4.5
- **包管理**: npm / yarn
- **其他依赖**: echarts, three.js, urdf-loader, xacro-parser, lodash, axios

## 开发命令

```bash
npm install        # 安装依赖
npm run serve      # 启动开发服务器 (需要 --openssl-legacy-provider)
npm run build      # 构建生产版本
npm run lint       # 代码检查
```

注意：由于 Node.js 版本兼容性问题，`serve` 和 `build` 脚本中设置了 `NODE_OPTIONS=--openssl-legacy-provider`。

## 项目结构

```
src/
├── App.vue                              # 根组件，包含两个 Tab 页
├── main.js                              # 入口文件，注册 Element UI
├── pages/
│   ├── module_settings.vue              # 模块配置页面（主要交互页面）
│   └── code_generator.vue               # YAML 生成与下载页面
├── components/
│   ├── CanSelector.vue                  # CAN 总线实例选择器
│   ├── ConnectionLostActionSelector.vue  # 连接丢失动作选择器
│   ├── ControlPeriodInput.vue           # 控制周期输入
│   ├── HexInput.vue                     # 十六进制输入框
│   ├── NumberInput.vue                  # 通用数字输入框
│   ├── PortSelector.vue                # 端口选择器
│   ├── Ros2TopicNameInput.vue          # ROS2 Topic 名称输入
│   └── message_types/                  # ROS2 消息定义展示组件
│       ├── Read*.vue                   # 读消息类型（从站→主站）
│       └── Write*.vue                  # 写消息类型（主站→从站）
└── utils/
    └── generate-module-def.js          # 核心 YAML 生成逻辑
```

## 核心架构

### 数据流

1. 用户在 `module_settings.vue` 中添加模块和任务，数据保存在 `localStorage` 的 `modules_info` 键中
2. 切换到 `code_generator.vue` Tab 时，读取 `localStorage` 中的配置
3. `generate-module-def.js` 中的 `generateModuleDef()` 函数计算 PDO/SDO 偏移量并生成 YAML 文本
4. 用户可下载完整的 `config.yaml` 文件

### 模块类型 (Module Types)

| Type ID | 名称 | PDO 限制 (TX/RX) |
|---------|------|-------------------|
| 0x03 | H750 Universal Module | 80 / 80 bytes |
| 0x04 | H750 Universal Module (Large PDO V.) | 112 / 80 bytes |

### 任务类型 (Task/App Types)

| Type ID | 名称 | 方向 | 说明 |
|---------|------|------|------|
| 0x01 | DJI RC | Read | DJI 遥控器 |
| 0x02 | LkTech Motor | Read+Write | 力矩电机（多种控制模式） |
| 0x03 | HIPNUC IMU | Read | CAN 总线 IMU |
| 0x04 | DSHOT600 | Write | ESC 电调协议 |
| 0x05 | DJI Motor | Read+Write | 大疆电机（最多 4 个，含 PID 配置） |
| 0x06 | OnBoard PWM | Write | 板载 PWM |
| 0x07 | External PWM | Write | 外置 PWM 板 |
| 0x08 | MS5837(30BA) | Read | I2C 压力传感器 |
| 0x0A | PMU(CAN) | Read | CAN 电源管理单元 |
| 0x0B | SBUS RC | Read | SBUS 遥控器 |
| 0x0C | DM Motor | Read+Write | 达妙电机 |
| 0x0D | Super Capacitor | Read+Write | 超级电容 |

## 编码约定

- 使用 Vue 2 Options API（`data()`, `methods`, `watch`, `mounted`）
- 组件通过 `localStorage` 共享状态，未使用 Vuex
- 任务类型使用十六进制 ID 标识（如 `0x01`, `0x05`）
- 任务数据模板定义在 `module_settings.vue` 的 `examples` 对象中，新增任务类型需在此添加默认配置
- `generate-module-def.js` 中的 `switch(task_info.type)` 是 YAML 生成的核心分发逻辑，新增任务类型需在此添加生成分支
- ROS2 消息展示组件放在 `src/components/message_types/` 目录下

## 新增任务类型的步骤

1. 在 `module_settings.vue` 的 `examples` 中添加任务默认数据模板
2. 在 `module_settings.vue` 的 `getAppTypeFriendlyName()` 中添加友好名称
3. 在 `module_settings.vue` 的模板中添加该任务类型的配置表单
4. 在 `src/components/message_types/` 中创建对应的 ROS2 消息展示组件
5. 在 `generate-module-def.js` 的 `switch` 中添加该类型的 YAML 生成逻辑（包括 PDO 偏移计算）
6. 在 `code_generator.vue` 中验证 PDO 长度是否溢出

## 部署

- `vue.config.js` 中配置了 `publicPath: '/TaskEditor/'`
- 构建产物在 `dist/` 目录
- 应用版本号在 `App.vue` 中标注（当前为 v2.1）
