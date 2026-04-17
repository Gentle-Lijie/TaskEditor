/**
 * parse-config.js
 * Parses a generated config.yaml back into the modules_info data structure
 * for re-editing in the TaskEditor.
 *
 * Two-pass architecture:
 *   Pass 1 (tokenize): line-by-line extraction of flat key-value pairs
 *   Pass 2 (map): task-type-specific mappers convert flat data to structured objects
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_TAGS = new Set([
  'uint8_t', 'uint16_t', 'uint32_t',
  'int8_t', 'int16_t', 'int32_t',
  'float', 'std::string',
]);

const INT_TAGS = new Set([
  'uint8_t', 'uint16_t', 'uint32_t',
  'int8_t', 'int16_t', 'int32_t',
]);

function parseTypedValue(rawValue, tag, lineNum, errors) {
  if (tag === 'std::string') {
    let v = rawValue;
    while (v.length >= 2 &&
      ((v[0] === "'" && v[v.length - 1] === "'") ||
       (v[0] === '"' && v[v.length - 1] === '"'))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  if (tag === 'float') {
    const num = parseFloat(rawValue);
    if (isNaN(num)) {
      errors.push({ line: lineNum + 1, message: `Invalid float value: "${rawValue}"` });
      return 0;
    }
    return num;
  }
  if (INT_TAGS.has(tag)) {
    if (rawValue.startsWith('0x') || rawValue.startsWith('0X')) {
      const num = parseInt(rawValue, 16);
      if (isNaN(num)) {
        errors.push({ line: lineNum + 1, message: `Invalid hex value: "${rawValue}" for !${tag}` });
        return 0;
      }
      return num;
    }
    const num = parseInt(rawValue, 10);
    if (isNaN(num)) {
      errors.push({ line: lineNum + 1, message: `Invalid integer value: "${rawValue}" for !${tag}` });
      return 0;
    }
    return num;
  }
  // Unknown tag — should not happen if parsePropertyLine validates
  errors.push({ line: lineNum + 1, message: `Unknown type tag: !${tag}` });
  return rawValue;
}

function parsePropertyLine(trimmed, lineNum, errors) {
  const propMatch = trimmed.match(/^([\w]+):\s+!(\S+)\s+(.+)$/);
  if (propMatch) {
    const tag = propMatch[2];
    if (!VALID_TAGS.has(tag)) {
      errors.push({ line: lineNum + 1, message: `Unknown type tag !${tag}, expected one of: ${[...VALID_TAGS].join(', ')}` });
      return null;
    }
    return { key: propMatch[1], value: parseTypedValue(propMatch[3].trim(), tag, lineNum, errors) };
  }
  // Lines without a !type tag are invalid in this config format
  const fallback = trimmed.match(/^([\w]+):\s+(.+)$/);
  if (fallback) {
    errors.push({ line: lineNum + 1, message: `Missing type tag on "${fallback[1]}", expected format: key: !type value` });
    return null;
  }
  return null;
}

function stripHexPrefix(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') {
    return value.toString(16).padStart(2, '0');
  }
  return String(value).replace(/^0x/i, '');
}

function defaultPid() {
  return { kp: 1, ki: 0, kd: 0, maxout: 10000, maxiout: 1000 };
}

function extractPidParams(flat, prefix) {
  const pid = defaultPid();
  const yamlFields = ['kp', 'ki', 'kd', 'max_out', 'max_iout'];
  const localFields = ['kp', 'ki', 'kd', 'maxout', 'maxiout'];
  for (let i = 0; i < yamlFields.length; i++) {
    const key = `${prefix}_${yamlFields[i]}`;
    if (key in flat) pid[localFields[i]] = flat[key];
  }
  return pid;
}

/**
 * Reverse of get_dji_motor_report_id from generate-module-def.js
 */
function reverseDjiMotorId(canPacketId, reportId) {
  const ctrlId = typeof canPacketId === 'number'
    ? '0x' + canPacketId.toString(16)
    : canPacketId;
  switch (ctrlId) {
    case '0x200':
      return reportId - 0x200;
    case '0x2ff':
    case '0x2fe':
    case '0x1fe':
      return reportId - 0x204;
    case '0x1ff':
      if (reportId >= 0x205 && reportId <= 0x208) return reportId - 0x204;
      return reportId - 0x200;
    default:
      return reportId - 0x200;
  }
}

// ─── Pass 1: Tokenize ───────────────────────────────────────────────────────

function pass1Tokenize(yamlText) {
  const lines = yamlText.split('\n');
  const modules = [];
  const errors = [];
  let currentModule = null;
  let currentTask = null;
  let inTasksSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed === 'slaves:') continue;

    // Module header: "  - sn{N}:"
    const moduleMatch = trimmed.match(/^- (sn\d+):$/);
    if (moduleMatch) {
      currentModule = { sn: moduleMatch[1].replace('sn', ''), latency_topic: '', tasks: [] };
      modules.push(currentModule);
      currentTask = null;
      inTasksSection = false;
      continue;
    }

    if (!currentModule) {
      errors.push({ line: i + 1, message: `Line outside module: ${trimmed}` });
      continue;
    }

    // "tasks:" marks start of tasks section
    if (!inTasksSection && trimmed === 'tasks:') {
      inTasksSection = true;
      continue;
    }

    // Module-level properties (before tasks section)
    if (!inTasksSection) {
      if (trimmed.startsWith('latency_pub_topic:')) {
        const parsed = parsePropertyLine(trimmed, i, errors);
        if (parsed) currentModule.latency_topic = parsed.value;
      }
      // sdo_len, task_count are informational — skip
      continue;
    }

    // Task header: "        - app_{N}:"
    const taskMatch = trimmed.match(/^- app_\d+:$/);
    if (taskMatch) {
      currentTask = { _flat: {} };
      currentModule.tasks.push(currentTask);
      continue;
    }

    if (!currentTask) {
      errors.push({ line: i + 1, message: `Property before task header: ${trimmed}` });
      continue;
    }

    // Task properties
    const parsed = parsePropertyLine(trimmed, i, errors);
    if (parsed) {
      currentTask._flat[parsed.key] = parsed.value;
    }
  }

  return { modules, errors };
}

// ─── Pass 2: Task-type mappers ──────────────────────────────────────────────

function mapDjirc(flat) {
  return {
    type: 0x01,
    read_topic: flat['pub_topic'] || '',
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
  };
}

function mapVt13(flat) {
  return {
    type: 14,
    read_topic: flat['pub_topic'] || '',
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
  };
}

function mapSbusRc(flat) {
  return {
    type: 11,
    read_topic: flat['pub_topic'] || '',
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
  };
}

function mapLkMotor(flat) {
  const canPacketId = flat['sdowrite_can_packet_id'] ?? 0x141;
  return {
    type: 0x02,
    can_inst: flat['sdowrite_can_inst'] ?? 1,
    motor_id: canPacketId - 0x140 || 1,
    can_packet_id: canPacketId,
    control_period: flat['sdowrite_control_period'] ?? 1,
    control_type: flat['sdowrite_control_type'] ?? 0x01,
    read_topic: flat['pub_topic'] || '',
    write_topic: flat['sub_topic'] || '',
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
  };
}

function mapHipnucImu(flat) {
  return {
    type: 0x03,
    read_topic: flat['pub_topic'] || '',
    frame_name: flat['conf_frame_name'] || 'imu_link',
    can_inst: flat['sdowrite_can_inst'] ?? 1,
    packet1_id: stripHexPrefix(flat['sdowrite_packet1_id']),
    packet2_id: stripHexPrefix(flat['sdowrite_packet2_id']),
    packet3_id: stripHexPrefix(flat['sdowrite_packet3_id']),
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
  };
}

function mapDshot(flat) {
  return {
    type: 0x04,
    dshot_id: flat['sdowrite_dshot_id'] ?? 1,
    write_topic: flat['sub_topic'] || '',
    init_value: flat['sdowrite_init_value'] ?? 0,
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
  };
}

function mapDjiMotor(flat) {
  const canPacketId = flat['sdowrite_can_packet_id'] ?? 0x200;
  const motor_enable = [false, false, false, false];
  const motor_id = [1, 2, 3, 4];
  const motor_control_type = [0x01, 0x01, 0x01, 0x01];
  const motor_speed_pid_param = [defaultPid(), defaultPid(), defaultPid(), defaultPid()];
  const motor_angle_pid_param = [defaultPid(), defaultPid(), defaultPid(), defaultPid()];

  for (let i = 1; i <= 4; i++) {
    const canIdKey = `sdowrite_motor${i}_can_id`;
    if (canIdKey in flat && flat[canIdKey] !== 0) {
      motor_enable[i - 1] = true;
      motor_id[i - 1] = reverseDjiMotorId(canPacketId, flat[canIdKey]);
    }
    const ctrlKey = `sdowrite_motor${i}_control_type`;
    if (ctrlKey in flat) motor_control_type[i - 1] = flat[ctrlKey];
    motor_speed_pid_param[i - 1] = extractPidParams(flat, `sdowrite_motor${i}_speed_pid`);
    motor_angle_pid_param[i - 1] = extractPidParams(flat, `sdowrite_motor${i}_angle_pid`);
  }

  return {
    type: 0x05,
    can_inst: flat['sdowrite_can_inst'] ?? 1,
    can_packet_id: canPacketId,
    control_period: flat['sdowrite_control_period'] ?? 1,
    motor_enable,
    motor_id,
    motor_control_type,
    motor_speed_pid_param,
    motor_angle_pid_param,
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
    read_topic: flat['pub_topic'] || '',
    write_topic: flat['sub_topic'] || '',
  };
}

function mapOnboardPwm(flat) {
  return {
    type: 6,
    port_id: flat['sdowrite_port_id'] ?? 1,
    expected_period: flat['sdowrite_pwm_period'] ?? 0,
    init_value: flat['sdowrite_init_value'] ?? 0,
    write_topic: flat['sub_topic'] || '',
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
  };
}

function mapExternalPwm(flat) {
  return {
    type: 7,
    uart_id: flat['sdowrite_uart_id'] ?? 1,
    expected_period: flat['sdowrite_pwm_period'] ?? 0,
    enabled_channel_count: flat['sdowrite_channel_num'] ?? 1,
    init_value: flat['sdowrite_init_value'] ?? 0,
    write_topic: flat['sub_topic'] || '',
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
  };
}

function mapMs5837(flat) {
  return {
    type: 8,
    i2c_id: flat['sdowrite_i2c_id'] ?? 3,
    osr_id: flat['sdowrite_osr_id'] ?? 1,
    read_topic: flat['pub_topic'] || '',
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
  };
}

function mapPmu(flat) {
  return {
    type: 10,
    read_topic: flat['pub_topic'] || '',
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
  };
}

function mapDmMotor(flat) {
  return {
    type: 12,
    can_inst: flat['sdowrite_can_inst'] ?? 1,
    can_id: stripHexPrefix(flat['sdowrite_can_id']),
    master_id: stripHexPrefix(flat['sdowrite_master_id']),
    control_period: flat['sdowrite_control_period'] ?? 1,
    control_type: flat['sdowrite_control_type'] ?? 1,
    pmax: flat['conf_pmax'] ?? 3.141592653589793,
    vmax: flat['conf_vmax'] ?? 30,
    tmax: flat['conf_tmax'] ?? 10,
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
    read_topic: flat['pub_topic'] || '',
    write_topic: flat['sub_topic'] || '',
  };
}

function mapSuperCap(flat) {
  return {
    type: 13,
    can_inst: flat['sdowrite_can_inst'] ?? 1,
    chassis_to_cap_id: stripHexPrefix(flat['sdowrite_chassis_to_cap_id']),
    cap_to_chassis_id: stripHexPrefix(flat['sdowrite_cap_to_chassis_id']),
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
    read_topic: flat['pub_topic'] || '',
    write_topic: flat['sub_topic'] || '',
  };
}

function mapDdMotor(flat) {
  const motor_enable = [false, false, false, false];
  const motor_id = [1, 2, 3, 4];
  const motor_control_type = [0x01, 0x01, 0x01, 0x01];

  for (let i = 1; i <= 4; i++) {
    const canIdKey = `sdowrite_motor${i}_can_id`;
    if (canIdKey in flat && flat[canIdKey] !== 0) {
      motor_enable[i - 1] = true;
      motor_id[i - 1] = flat[canIdKey] - 0x96;
    }
    const ctrlKey = `sdowrite_motor${i}_control_type`;
    if (ctrlKey in flat) motor_control_type[i - 1] = flat[ctrlKey];
  }

  return {
    type: 15,
    can_inst: flat['sdowrite_can_inst'] ?? 1,
    can_type: flat['sdowrite_can_baudrate'] ?? 1,
    can_packet_id: flat['sdowrite_can_packet_id'] ?? 0x32,
    control_period: flat['sdowrite_control_period'] ?? 1,
    motor_enable,
    motor_id,
    motor_control_type,
    connection_lost_read_action: flat['conf_connection_lost_read_action'] ?? 0x01,
    connection_lost_write_action: flat['sdowrite_connection_lost_write_action'] ?? 0x01,
    read_topic: flat['pub_topic'] || '',
    write_topic: flat['sub_topic'] || '',
  };
}

const TASK_MAPPERS = {
  1: mapDjirc,
  2: mapLkMotor,
  3: mapHipnucImu,
  4: mapDshot,
  5: mapDjiMotor,
  6: mapOnboardPwm,
  7: mapExternalPwm,
  8: mapMs5837,
  10: mapPmu,
  11: mapSbusRc,
  12: mapDmMotor,
  13: mapSuperCap,
  14: mapVt13,
  15: mapDdMotor,
};

// ─── Main entry ─────────────────────────────────────────────────────────────

export function parseConfigYaml(yamlText) {
  if (!yamlText || typeof yamlText !== 'string') {
    return { modules: [], errors: [{ message: 'Empty or invalid input' }] };
  }

  const { modules: rawModules, errors } = pass1Tokenize(yamlText);

  const modules = rawModules.map(rawMod => {
    const tasks = rawMod.tasks.map(rawTask => {
      const taskType = rawTask._flat['sdowrite_task_type'];
      if (taskType === undefined) {
        errors.push({ message: 'Task missing sdowrite_task_type, skipped' });
        return null;
      }
      const mapper = TASK_MAPPERS[taskType];
      if (!mapper) {
        errors.push({ message: `Unknown task type ${taskType}, skipped` });
        return null;
      }
      try {
        return mapper(rawTask._flat);
      } catch (e) {
        errors.push({ message: `Error parsing task type ${taskType}: ${e.message}` });
        return null;
      }
    }).filter(Boolean);

    return {
      type: 0x03,
      sn: rawMod.sn,
      latency_topic: rawMod.latency_topic,
      task: tasks,
    };
  });

  return { modules, errors };
}
