/**
 * verify-config.js
 * Validates an EtherCAT config.yaml file against structural and semantic rules.
 *
 * Shared by CLI (`scripts/verify-config.js`) and Web UI.
 *
 * Main export: verifyConfig(yamlText) → { valid, errors, warnings, stats }
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_TAGS = new Set([
  'uint8_t', 'uint16_t', 'uint32_t',
  'int8_t', 'int16_t', 'int32_t',
  'float', 'std::string',
]);

const INT_TAGS = new Set([
  'uint8_t', 'uint16_t', 'uint32_t',
  'int8_t', 'int16_t', 'int32_t',
]);

const TAG_BYTE_SIZE = {
  uint8_t: 1, int8_t: 1,
  uint16_t: 2, int16_t: 2,
  uint32_t: 4, int32_t: 4,
  float: 4,
};

const TAG_RANGES = {
  uint8_t: [0, 255],
  int8_t: [-128, 127],
  uint16_t: [0, 65535],
  int16_t: [-32768, 32767],
  uint32_t: [0, 4294967295],
  int32_t: [-2147483648, 2147483647],
};

const TASK_TYPE_NAMES = {
  1: 'DJI RC',
  2: 'LkTech Motor',
  3: 'HIPNUC IMU(CAN)',
  4: 'DSHOT600',
  5: 'DJI Motor',
  6: 'OnBoard PWM',
  7: 'External PWM',
  8: 'MS5837(30BA)',
  10: 'PMU(CAN)',
  11: 'SBUS RC',
  12: 'DM Motor',
  13: 'Super Capacitor',
  14: 'DJI VT13',
  15: 'DD Motor',
};

const VALID_TASK_TYPES = new Set(Object.keys(TASK_TYPE_NAMES).map(Number));

/**
 * Required fields per task type (keys = YAML field names)
 * Common fields (sdowrite_task_type, pub_topic, sub_topic, pdoread_offset, pdowrite_offset,
 * conf_connection_lost_read_action, sdowrite_connection_lost_write_action) are checked separately.
 */
const REQUIRED_FIELDS = {
  1: [],  // DJI RC — no extra required fields beyond common
  2: ['sdowrite_control_period', 'sdowrite_can_inst', 'sdowrite_control_type'],
  3: ['sdowrite_can_inst', 'sdowrite_packet1_id', 'sdowrite_packet2_id', 'sdowrite_packet3_id', 'conf_frame_name'],
  4: ['sdowrite_dshot_id', 'sdowrite_init_value'],
  5: ['sdowrite_control_period', 'sdowrite_can_packet_id', 'sdowrite_motor1_can_id', 'sdowrite_motor2_can_id', 'sdowrite_motor3_can_id', 'sdowrite_motor4_can_id', 'sdowrite_can_inst'],
  6: ['sdowrite_port_id', 'sdowrite_pwm_period', 'sdowrite_init_value'],
  7: ['sdowrite_uart_id', 'sdowrite_pwm_period', 'sdowrite_channel_num', 'sdowrite_init_value'],
  8: ['sdowrite_i2c_id', 'sdowrite_osr_id'],
  10: [],
  11: [],
  12: ['sdowrite_control_period', 'sdowrite_can_id', 'sdowrite_master_id', 'sdowrite_can_inst', 'sdowrite_control_type', 'conf_pmax', 'conf_vmax', 'conf_tmax'],
  13: ['sdowrite_can_inst', 'sdowrite_chassis_to_cap_id', 'sdowrite_cap_to_chassis_id'],
  14: [],
  15: ['sdowrite_control_period', 'sdowrite_can_baudrate', 'sdowrite_can_packet_id', 'sdowrite_motor1_can_id', 'sdowrite_motor2_can_id', 'sdowrite_motor3_can_id', 'sdowrite_motor4_can_id', 'sdowrite_can_inst'],
};

/**
 * All known YAML field names per task type (for unknown-field detection)
 */
const KNOWN_FIELDS = {
  1: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'pub_topic', 'pdoread_offset'],
  2: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'sdowrite_connection_lost_write_action', 'pub_topic', 'pdoread_offset', 'sub_topic', 'pdowrite_offset', 'sdowrite_control_period', 'sdowrite_can_packet_id', 'sdowrite_can_inst', 'sdowrite_control_type'],
  3: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'pub_topic', 'pdoread_offset', 'sdowrite_can_inst', 'sdowrite_packet1_id', 'sdowrite_packet2_id', 'sdowrite_packet3_id', 'conf_frame_name'],
  4: ['sdowrite_task_type', 'sdowrite_connection_lost_write_action', 'sub_topic', 'pdowrite_offset', 'sdowrite_dshot_id', 'sdowrite_init_value'],
  5: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'sdowrite_connection_lost_write_action', 'pub_topic', 'pdoread_offset', 'sub_topic', 'pdowrite_offset', 'sdowrite_control_period', 'sdowrite_can_packet_id', 'sdowrite_can_inst'],
  6: ['sdowrite_task_type', 'sdowrite_connection_lost_write_action', 'sub_topic', 'pdowrite_offset', 'sdowrite_port_id', 'sdowrite_pwm_period', 'sdowrite_init_value'],
  7: ['sdowrite_task_type', 'sdowrite_connection_lost_write_action', 'sub_topic', 'pdowrite_offset', 'sdowrite_uart_id', 'sdowrite_pwm_period', 'sdowrite_channel_num', 'sdowrite_init_value'],
  8: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'pub_topic', 'pdoread_offset', 'sdowrite_i2c_id', 'sdowrite_osr_id'],
  10: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'pub_topic', 'pdoread_offset'],
  11: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'pub_topic', 'pdoread_offset'],
  12: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'sdowrite_connection_lost_write_action', 'pub_topic', 'pdoread_offset', 'sub_topic', 'pdowrite_offset', 'sdowrite_control_period', 'sdowrite_can_id', 'sdowrite_master_id', 'sdowrite_can_inst', 'sdowrite_control_type', 'conf_pmax', 'conf_vmax', 'conf_tmax'],
  13: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'sdowrite_connection_lost_write_action', 'pub_topic', 'pdoread_offset', 'sub_topic', 'pdowrite_offset', 'sdowrite_can_inst', 'sdowrite_chassis_to_cap_id', 'sdowrite_cap_to_chassis_id'],
  14: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'pub_topic', 'pdoread_offset'],
  15: ['sdowrite_task_type', 'conf_connection_lost_read_action', 'sdowrite_connection_lost_write_action', 'pub_topic', 'pdoread_offset', 'sub_topic', 'pdowrite_offset', 'sdowrite_control_period', 'sdowrite_can_baudrate', 'sdowrite_can_packet_id', 'sdowrite_can_inst'],
};

// Add motor-specific fields for types 5 and 15
for (let i = 1; i <= 4; i++) {
  [5, 15].forEach(type => {
    KNOWN_FIELDS[type].push(`sdowrite_motor${i}_can_id`, `sdowrite_motor${i}_control_type`);
  });
  // PID fields for DJI Motor (type 5)
  ['speed_pid_kp', 'speed_pid_ki', 'speed_pid_kd', 'speed_pid_max_out', 'speed_pid_max_iout',
    'angle_pid_kp', 'angle_pid_ki', 'angle_pid_kd', 'angle_pid_max_out', 'angle_pid_max_iout'].forEach(suffix => {
    KNOWN_FIELDS[5].push(`sdowrite_motor${i}_${suffix}`);
  });
}

// ─── Tokenize (reuse pass1 from parse-config.js, extended to capture raw lines) ──

function tokenize(yamlText) {
  const lines = yamlText.split('\n');
  const modules = [];
  const errors = [];
  const warnings = [];
  let currentModule = null;
  let currentTask = null;
  let inTasksSection = false;
  let hasSlavesHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    // slaves: header
    if (i === 0 || (!hasSlavesHeader && trimmed === 'slaves:')) {
      if (trimmed === 'slaves:') {
        hasSlavesHeader = true;
        continue;
      }
    }

    // Module header: "  - sn{N}:"
    const moduleMatch = trimmed.match(/^- (sn(\d+)):/);
    if (moduleMatch) {
      if (!hasSlavesHeader) {
        errors.push({ line: i + 1, code: 'MISSING_HEADER', message: 'File does not start with "slaves:"' });
        hasSlavesHeader = true; // suppress repeat
      }
      currentModule = {
        sn: moduleMatch[2],
        snRaw: moduleMatch[1],
        line: i + 1,
        latency_topic: '',
        task_count_declared: null,
        sdo_len_declared: null,
        tasks: [],
        rawLines: [],
      };
      modules.push(currentModule);
      currentTask = null;
      inTasksSection = false;
      continue;
    }

    if (!currentModule) {
      errors.push({ line: i + 1, code: 'ORPHAN_LINE', message: `Line outside module: "${trimmed}"` });
      continue;
    }

    currentModule.rawLines.push({ lineNum: i, text: trimmed });

    // "tasks:" marks start of tasks section
    if (!inTasksSection && trimmed === 'tasks:') {
      inTasksSection = true;
      continue;
    }

    // Module-level properties (before tasks section)
    if (!inTasksSection) {
      const parsed = parseLineForValidation(trimmed, i, errors, warnings);
      if (parsed) {
        if (parsed.key === 'latency_pub_topic') currentModule.latency_topic = parsed.value;
        if (parsed.key === 'task_count') currentModule.task_count_declared = parsed.value;
        if (parsed.key === 'sdo_len') currentModule.sdo_len_declared = parsed.value;
      }
      continue;
    }

    // Task header: "        - app_{N}:"
    const taskMatch = trimmed.match(/^- app_(\d+):$/);
    if (taskMatch) {
      currentTask = {
        appNum: parseInt(taskMatch[1]),
        line: i + 1,
        _flat: {},
        _typed: [], // { key, tag, rawValue, lineNum }
      };
      currentModule.tasks.push(currentTask);
      continue;
    }

    if (!currentTask) {
      errors.push({ line: i + 1, code: 'ORPHAN_PROPERTY', message: `Property before task header: "${trimmed}"` });
      continue;
    }

    // Task properties
    const parsed = parseLineForValidation(trimmed, i, errors, warnings);
    if (parsed) {
      currentTask._flat[parsed.key] = parsed.value;
      currentTask._typed.push({ key: parsed.key, tag: parsed.tag, rawValue: parsed.rawValue, lineNum: i + 1 });
    }
  }

  if (!hasSlavesHeader) {
    errors.push({ code: 'MISSING_HEADER', message: 'File does not contain "slaves:" header' });
  }

  return { modules, errors, warnings };
}

/**
 * Parse a single property line with validation.
 * Returns { key, value, tag, rawValue } or null.
 */
function parseLineForValidation(trimmed, lineIdx, errors, warnings) {
  const propMatch = trimmed.match(/^([\w]+):\s+!(\S+)\s+(.+)$/);
  if (propMatch) {
    const key = propMatch[1];
    const tag = propMatch[2];
    const rawValue = propMatch[3].trim();

    if (!VALID_TAGS.has(tag)) {
      errors.push({
        line: lineIdx + 1,
        code: 'UNKNOWN_TAG',
        message: `Unknown type tag "!${tag}" on "${key}", expected one of: ${[...VALID_TAGS].join(', ')}`,
      });
      return null;
    }

    // Validate value against tag
    validateTypedValue(rawValue, tag, key, lineIdx + 1, errors, warnings);

    // Parse actual value
    const value = parseValue(rawValue, tag);
    return { key, value, tag, rawValue };
  }

  // Line without a !type tag
  const fallback = trimmed.match(/^([\w]+):\s+(.+)$/);
  if (fallback) {
    // Special case: known module-level keys with no tag
    const key = fallback[1];
    if (['sdo_len', 'task_count', 'latency_pub_topic', 'tasks', 'slaves'].includes(key)) {
      errors.push({
        line: lineIdx + 1,
        code: 'MISSING_TAG',
        message: `"${key}" is missing type tag, expected format: ${key}: !<type> <value>`,
      });
      return null;
    }
    errors.push({
      line: lineIdx + 1,
      code: 'MISSING_TAG',
      message: `Missing type tag on "${key}", expected format: key: !type value`,
    });
    return null;
  }

  return null;
}

function validateTypedValue(rawValue, tag, key, lineNum, errors, warnings) {
  if (tag === 'std::string') {
    if (rawValue.startsWith("'") || rawValue.startsWith('"')) {
      // OK — quoted string
    } else {
      warnings.push({
        line: lineNum,
        code: 'UNQUOTED_STRING',
        message: `String value for "${key}" is not quoted: ${rawValue}`,
      });
    }
    return;
  }

  if (tag === 'float') {
    if (isNaN(parseFloat(rawValue))) {
      errors.push({
        line: lineNum,
        code: 'INVALID_FLOAT',
        message: `Invalid float value: "${rawValue}" for "${key}"`,
      });
    }
    return;
  }

  if (INT_TAGS.has(tag)) {
    let num;
    if (rawValue.startsWith('0x') || rawValue.startsWith('0X')) {
      num = parseInt(rawValue, 16);
      if (isNaN(num)) {
        errors.push({
          line: lineNum,
          code: 'INVALID_HEX',
          message: `Invalid hex value: "${rawValue}" for "${key}"`,
        });
        return;
      }
    } else {
      num = parseInt(rawValue, 10);
      if (isNaN(num)) {
        errors.push({
          line: lineNum,
          code: 'INVALID_INT',
          message: `Invalid integer value: "${rawValue}" for "${key}"`,
        });
        return;
      }
    }

    // Range check
    const range = TAG_RANGES[tag];
    if (range && (num < range[0] || num > range[1])) {
      errors.push({
        line: lineNum,
        code: 'VALUE_OUT_OF_RANGE',
        message: `Value ${num} for "${key}" (!${tag}) out of range [${range[0]}, ${range[1]}]`,
      });
    }
  }
}

function parseValue(rawValue, tag) {
  if (tag === 'std::string') {
    if ((rawValue.startsWith("'") && rawValue.endsWith("'")) ||
        (rawValue.startsWith('"') && rawValue.endsWith('"'))) {
      return rawValue.slice(1, -1);
    }
    return rawValue;
  }
  if (tag === 'float') return parseFloat(rawValue);
  if (INT_TAGS.has(tag)) {
    if (rawValue.startsWith('0x') || rawValue.startsWith('0X')) return parseInt(rawValue, 16);
    return parseInt(rawValue, 10);
  }
  return rawValue;
}

// ─── sdo_len calculation (mirrors get_length from generate-module-def.js) ─────

function calculateSdoLen(typedEntries) {
  let total = 0;
  for (const { key, tag } of typedEntries) {
    if (!key.startsWith('sdowrite_')) continue;
    const size = TAG_BYTE_SIZE[tag];
    if (size) total += size;
  }
  return total + 1; // +1 as in generate-module-def.js
}

// ─── PDO offset calculation (mirrors generate-module-def.js logic) ────────────

function calculatePdoOffsets(tasks) {
  let pdoreadOffset = 0;
  let pdowriteOffset = 0;
  const results = [];

  for (const task of tasks) {
    const flat = task._flat;
    const type = flat['sdowrite_task_type'];
    const entry = { type, pdoread_offset: pdoreadOffset, pdowrite_offset: pdowriteOffset };

    switch (type) {
      case 1: pdoreadOffset += 19; break;
      case 2: {
        const ctrlType = flat['sdowrite_control_type'];
        if (ctrlType !== 8) {
          pdoreadOffset += 8;
        } else {
          pdoreadOffset += 32;
        }
        switch (ctrlType) {
          case 1: case 2: pdowriteOffset += 3; break;
          case 3: pdowriteOffset += 7; break;
          case 4: pdowriteOffset += 5; break;
          case 5: pdowriteOffset += 7; break;
          case 6: pdowriteOffset += 6; break;
          case 7: pdowriteOffset += 8; break;
          case 8: pdowriteOffset += 8; break;
        }
        break;
      }
      case 3: pdoreadOffset += 21; break;
      case 4: pdowriteOffset += 8; break;
      case 5: {
        let readLen = 0, writeLen = 0;
        for (let j = 1; j <= 4; j++) {
          if (flat[`sdowrite_motor${j}_can_id`] && flat[`sdowrite_motor${j}_can_id`] !== 0) {
            readLen += 9;
            writeLen += 3;
          }
        }
        pdoreadOffset += readLen;
        pdowriteOffset += writeLen;
        break;
      }
      case 6: pdowriteOffset += 8; break;
      case 7: pdowriteOffset += (flat['sdowrite_channel_num'] || 1) * 2; break;
      case 8: pdoreadOffset += 9; break;
      case 10: pdoreadOffset += 7; break;
      case 11: pdoreadOffset += 24; break;
      case 12: {
        pdoreadOffset += 9;
        const ctrlType = flat['sdowrite_control_type'];
        if (ctrlType === 1 || ctrlType === 2) pdowriteOffset += 9;
        else if (ctrlType === 3) pdowriteOffset += 5;
        break;
      }
      case 13: pdoreadOffset += 7; pdowriteOffset += 4; break;
      case 14: pdoreadOffset += 18; break;
      case 15: {
        let readLen = 0, writeLen = 0;
        for (let j = 1; j <= 4; j++) {
          if (flat[`sdowrite_motor${j}_can_id`] && flat[`sdowrite_motor${j}_can_id`] !== 0) {
            readLen += 9;
            writeLen += 3;
          }
        }
        pdoreadOffset += readLen;
        pdowriteOffset += writeLen;
        break;
      }
    }

    results.push(entry);
  }

  return results;
}

// ─── Main verification ───────────────────────────────────────────────────────

export function verifyConfig(yamlText) {
  if (!yamlText || typeof yamlText !== 'string') {
    return {
      valid: false,
      errors: [{ code: 'EMPTY_INPUT', message: 'Empty or invalid input' }],
      warnings: [],
      stats: { moduleCount: 0, taskCount: 0, totalErrors: 1, totalWarnings: 0 },
    };
  }

  const { modules, errors, warnings } = tokenize(yamlText);

  // ── A. SN uniqueness ──
  const seenSNs = new Map(); // sn → first module line
  for (const mod of modules) {
    if (seenSNs.has(mod.sn)) {
      errors.push({
        code: 'DUPLICATE_SN',
        module: mod.sn,
        line: mod.line,
        message: `Duplicate SN "sn${mod.sn}" (first defined at line ${seenSNs.get(mod.sn)})`,
      });
    } else {
      seenSNs.set(mod.sn, mod.line);
    }
  }

  // ── B. Per-module and per-task checks ──
  const allTopics = []; // { topic, moduleSn, appNum, line, kind }
  let totalTasks = 0;

  for (const mod of modules) {
    // ── task_count check ──
    if (mod.task_count_declared !== null && mod.task_count_declared !== mod.tasks.length) {
      errors.push({
        code: 'TASK_COUNT_MISMATCH',
        module: mod.sn,
        line: mod.line,
        fixable: true,
        message: `Declared task_count=${mod.task_count_declared} but found ${mod.tasks.length} task(s)`,
      });
    }

    // ── sdo_len check ──
    const allTyped = [];
    for (const task of mod.tasks) {
      allTyped.push(...task._typed);
    }
    const expectedSdoLen = calculateSdoLen(allTyped);
    if (mod.sdo_len_declared !== null && mod.sdo_len_declared !== expectedSdoLen) {
      errors.push({
        code: 'SDO_LEN_MISMATCH',
        module: mod.sn,
        line: mod.line,
        fixable: true,
        message: `Declared sdo_len=${mod.sdo_len_declared} but calculated=${expectedSdoLen}`,
      });
    }

    // ── latency_topic check ──
    if (mod.latency_topic) {
      allTopics.push({ topic: mod.latency_topic, moduleSn: mod.sn, appNum: 0, line: mod.line, kind: 'latency' });
      if (!mod.latency_topic.startsWith('/')) {
        warnings.push({
          code: 'TOPIC_FORMAT',
          module: mod.sn,
          line: mod.line,
          message: `latency_pub_topic "${mod.latency_topic}" does not start with "/"`,
        });
      }
      const expectedLatency = `/ecat/sn${mod.sn}/latency`;
      if (mod.latency_topic !== expectedLatency) {
        warnings.push({
          code: 'TOPIC_CONVENTION',
          module: mod.sn,
          line: mod.line,
          message: `latency_pub_topic "${mod.latency_topic}" does not match convention "${expectedLatency}"`,
        });
      }
    }

    // ── App numbering check ──
    for (let i = 0; i < mod.tasks.length; i++) {
      if (mod.tasks[i].appNum !== i + 1) {
        warnings.push({
          code: 'APP_NUMBERING',
          module: mod.sn,
          line: mod.tasks[i].line,
          message: `Expected app_${i + 1} but found app_${mod.tasks[i].appNum}`,
        });
      }
    }

    // ── PDO offset checks ──
    const expectedOffsets = calculatePdoOffsets(mod.tasks);
    for (let i = 0; i < mod.tasks.length; i++) {
      const task = mod.tasks[i];
      const flat = task._flat;
      const type = flat['sdowrite_task_type'];

      // ── Required task_type ──
      if (type === undefined) {
        errors.push({
          code: 'MISSING_TASK_TYPE',
          module: mod.sn,
          task: `app_${task.appNum}`,
          line: task.line,
          message: `Task app_${task.appNum} is missing sdowrite_task_type`,
        });
        continue;
      }

      // ── Unknown task type ──
      if (!VALID_TASK_TYPES.has(type)) {
        errors.push({
          code: 'UNKNOWN_TASK_TYPE',
          module: mod.sn,
          task: `app_${task.appNum}`,
          line: task.line,
          message: `Unknown task type ${type}`,
        });
        continue;
      }

      const typeName = TASK_TYPE_NAMES[type] || `Type ${type}`;

      // ── Required fields ──
      const required = REQUIRED_FIELDS[type] || [];
      for (const field of required) {
        if (!(field in flat)) {
          errors.push({
            code: 'MISSING_REQUIRED_FIELD',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `${typeName}: missing required field "${field}"`,
          });
        }
      }

      // ── Unknown fields ──
      const known = KNOWN_FIELDS[type] || [];
      for (const key of Object.keys(flat)) {
        if (!known.includes(key)) {
          warnings.push({
            code: 'UNKNOWN_FIELD',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `${typeName}: unknown field "${key}"`,
          });
        }
      }

      // ── Motor-specific logic checks ──
      if (type === 5) {
        // DJI Motor: if motor enabled, must have control_type
        for (let j = 1; j <= 4; j++) {
          const canId = flat[`sdowrite_motor${j}_can_id`];
          if (canId && canId !== 0) {
            if (!(`sdowrite_motor${j}_control_type` in flat)) {
              errors.push({
                code: 'MISSING_MOTOR_CONTROL_TYPE',
                module: mod.sn,
                task: `app_${task.appNum}`,
                line: task.line,
                message: `DJI Motor: motor${j} enabled (can_id=${canId}) but missing motor${j}_control_type`,
              });
            }
            const ctrlType = flat[`sdowrite_motor${j}_control_type`];
            if (ctrlType > 1) {
              const speedFields = ['kp', 'ki', 'kd', 'max_out', 'max_iout'];
              for (const suffix of speedFields) {
                if (!(`sdowrite_motor${j}_speed_pid_${suffix}` in flat)) {
                  errors.push({
                    code: 'MISSING_PID_FIELD',
                    module: mod.sn,
                    task: `app_${task.appNum}`,
                    line: task.line,
                    message: `DJI Motor: motor${j} control_type=${ctrlType} but missing motor${j}_speed_pid_${suffix}`,
                  });
                }
              }
            }
            if (ctrlType > 2) {
              const angleFields = ['kp', 'ki', 'kd', 'max_out', 'max_iout'];
              for (const suffix of angleFields) {
                if (!(`sdowrite_motor${j}_angle_pid_${suffix}` in flat)) {
                  errors.push({
                    code: 'MISSING_PID_FIELD',
                    module: mod.sn,
                    task: `app_${task.appNum}`,
                    line: task.line,
                    message: `DJI Motor: motor${j} control_type=${ctrlType} but missing motor${j}_angle_pid_${suffix}`,
                  });
                }
              }
            }
          }
        }
      }

      if (type === 15) {
        // DD Motor: if motor enabled, must have control_type
        for (let j = 1; j <= 4; j++) {
          const canId = flat[`sdowrite_motor${j}_can_id`];
          if (canId && canId !== 0) {
            if (!(`sdowrite_motor${j}_control_type` in flat)) {
              errors.push({
                code: 'MISSING_MOTOR_CONTROL_TYPE',
                module: mod.sn,
                task: `app_${task.appNum}`,
                line: task.line,
                message: `DD Motor: motor${j} enabled (can_id=${canId}) but missing motor${j}_control_type`,
              });
            }
          }
        }
      }

      if (type === 2) {
        // LkTech: if control_type != 8, must have can_packet_id
        const ctrlType = flat['sdowrite_control_type'];
        if (ctrlType !== 8 && !('sdowrite_can_packet_id' in flat)) {
          errors.push({
            code: 'MISSING_CAN_PACKET_ID',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `LkTech Motor: control_type=${ctrlType} requires sdowrite_can_packet_id`,
          });
        }
        // LkTech control_type range
        if (ctrlType !== undefined && (ctrlType < 1 || ctrlType > 8)) {
          errors.push({
            code: 'INVALID_CONTROL_TYPE',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `LkTech Motor: control_type=${ctrlType} out of valid range [1, 8]`,
          });
        }
      }

      // ── Topic checks ──
      if ('pub_topic' in flat) {
        const topic = flat['pub_topic'];
        allTopics.push({ topic, moduleSn: mod.sn, appNum: task.appNum, line: task.line, kind: 'read' });
        if (!topic) {
          warnings.push({
            code: 'EMPTY_TOPIC',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `pub_topic is empty`,
          });
        } else if (!topic.startsWith('/')) {
          errors.push({
            code: 'TOPIC_FORMAT',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `pub_topic "${topic}" does not start with "/"`,
          });
        }
        // Check SN in topic matches module SN
        const snInTopic = topic.match(/sn(\d+)/);
        if (snInTopic && snInTopic[1] !== mod.sn) {
          warnings.push({
            code: 'TOPIC_SN_MISMATCH',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `pub_topic "${topic}" references sn${snInTopic[1]} but module is sn${mod.sn}`,
          });
        }
      }

      if ('sub_topic' in flat) {
        const topic = flat['sub_topic'];
        allTopics.push({ topic, moduleSn: mod.sn, appNum: task.appNum, line: task.line, kind: 'write' });
        if (!topic) {
          warnings.push({
            code: 'EMPTY_TOPIC',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `sub_topic is empty`,
          });
        } else if (!topic.startsWith('/')) {
          errors.push({
            code: 'TOPIC_FORMAT',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `sub_topic "${topic}" does not start with "/"`,
          });
        }
        const snInTopic = topic.match(/sn(\d+)/);
        if (snInTopic && snInTopic[1] !== mod.sn) {
          warnings.push({
            code: 'TOPIC_SN_MISMATCH',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            message: `sub_topic "${topic}" references sn${snInTopic[1]} but module is sn${mod.sn}`,
          });
        }
      }

      // ── PDO offset validation ──
      if (i < expectedOffsets.length) {
        const expected = expectedOffsets[i];
        if ('pdoread_offset' in flat && flat['pdoread_offset'] !== expected.pdoread_offset) {
          errors.push({
            code: 'PDOREAD_OFFSET_MISMATCH',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            fixable: true,
            message: `pdoread_offset=${flat['pdoread_offset']} but expected ${expected.pdoread_offset}`,
          });
        }
        if ('pdowrite_offset' in flat && flat['pdowrite_offset'] !== expected.pdowrite_offset) {
          errors.push({
            code: 'PDOWRITE_OFFSET_MISMATCH',
            module: mod.sn,
            task: `app_${task.appNum}`,
            line: task.line,
            fixable: true,
            message: `pdowrite_offset=${flat['pdowrite_offset']} but expected ${expected.pdowrite_offset}`,
          });
        }
      }

      totalTasks++;
    }
  }

  // ── Cross-module topic uniqueness ──
  const topicMap = new Map(); // topic → [{ moduleSn, appNum, line, kind }]
  for (const entry of allTopics) {
    if (!topicMap.has(entry.topic)) topicMap.set(entry.topic, []);
    topicMap.get(entry.topic).push(entry);
  }
  for (const [topic, entries] of topicMap) {
    if (entries.length > 1 && topic) {
      const details = entries.map(e => `sn${e.moduleSn}/app_${e.appNum}`).join(', ');
      errors.push({
        code: 'DUPLICATE_TOPIC',
        message: `Topic "${topic}" used by multiple tasks: ${details}`,
      });
    }
  }

  const totalErrors = errors.length;
  const totalWarnings = warnings.length;

  return {
    valid: totalErrors === 0,
    errors,
    warnings,
    stats: { moduleCount: modules.length, taskCount: totalTasks, totalErrors, totalWarnings },
  };
}
