# EtherCAT Module Configuration Web App

This project is a Vue-based web application designed for configuring EtherCAT modules and generating their corresponding configuration files (YAML).

## Features

* **Module Management**: Add and manage multiple EtherCAT slave modules by Serial Number (SN).
* **Task Assignment**: Assign various hardware tasks to each module, including:
  * **Remote Controllers**: DJI RC, SBUS RC.
  * **Sensors**: HIPNUC IMU (CAN), SUPER CAP (CAN).
  * **Actuators**: DJI Motors, DM Motors, LkTech Motors, DSHOT600, OnBoard PWM.
* **Task Configuration**: Modify the configuration items of each task.
* **ROS2 Integration**: Customize publisher and subscriber topic names for seamless communication with ROS2.
* **Message Schema Visualization**: View the ROS2 message structure directly within the task configuration.
* **Automatic YAML Generation**: Generates a complete `config.yaml` file that can be used by the [EcatV2_Master](https://github.com/AIMEtherCAT/EcatV2_Master).

## Project Structure
* `src/pages/`: Contains the main application views (`module_settings.vue` for configuration and `code_generator.vue` for file generation).
* `src/components/`: Reusable UI components.
* `src/components/message_types/`: Vue templates representing ROS2 message definitions.
* `src/utils/generate-module-def.js`: The core logic that calculates memory offsets (PDO/SDO) and formats the YAML output.

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

## Why package count was high

The previous toolchain used Vue CLI + Webpack, which introduces a large dependency tree.
The project now uses Vite and removes unused runtime dependencies to reduce total installed packages.

### Usage

Please refer to [here](https://github.com/AIMEtherCAT/EcatV2_Master/blob/master/docs/configuration-generator.md).
