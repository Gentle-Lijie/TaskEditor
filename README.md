# EtherCAT Module Configuration Web App

This project is a Vue-based web application designed for configuring EtherCAT modules and generating their corresponding configuration files (YAML).

## Features

* **Module Management**: Add and manage multiple EtherCAT slave modules by Serial Number (SN).
* **Task Assignment**: Assign various hardware tasks to each module, including:
  * **Remote Controllers**: DJI RC, SBUS RC, VT13 RC.
  * **Sensors**: HIPNUC IMU (CAN), CAN PMU (CAN), SUPER CAP (CAN), MS5837.
  * **Actuators**: DJI Motors, DM Motors, DD Motors, LkTech Motors, DSHOT600, OnBoard PWM, External PWM.
* **Task Configuration**: Modify the configuration items of each task.
* **Import Configuration**: Upload a previously generated `config.yaml` to re-edit it in the editor.
* **Configuration Validation**: Built-in verification script to validate config files for type correctness and structural integrity.
* **ROS2 Integration**: Customize publisher and subscriber topic names for seamless communication with ROS2.
* **Message Schema Visualization**: View the ROS2 message structure directly within the task configuration.
* **Syntax Highlighting**: YAML output with syntax highlighting powered by highlight.js.
* **Automatic YAML Generation**: Generates a complete `config.yaml` file that can be used by the [EcatV2_Master](https://github.com/AIMEtherCAT/EcatV2_Master).

## Project Structure
* `src/pages/`: Main application views (`ModuleSettings.vue` for configuration and `CodeGenerator.vue` for file generation).
* `src/components/`: Reusable UI components.
* `src/components/message-types/`: Vue templates representing ROS2 message definitions.
* `src/components/module-settings/`: Module settings page specific components (e.g., `ImportConfigDialog.vue`).
* `src/components/code-generator/`: Code generator page specific components.
* `src/utils/generate-module-def.js`: Core logic that calculates memory offsets (PDO/SDO) and formats the YAML output.
* `src/utils/parse-config.js`: Parses a `config.yaml` back into the editor data structure for re-editing.
* `src/utils/verify-config.js`: Validates configuration files with type checks and structural verification.
* `scripts/verify-config.js`: Standalone script for validating config YAML files.

## Getting Started

### Prerequisites

* Node.js
* pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm serve
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## Dependency reduction notes

The previous toolchain used Vue CLI + Webpack, which introduces a large dependency tree.
The project now uses Vite and removes unused runtime dependencies to reduce total installed packages.

### Usage

Please refer to [here](https://github.com/AIMEtherCAT/EcatV2_Master/blob/master/docs/configuration-generator.md).
