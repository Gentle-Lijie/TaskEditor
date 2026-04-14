function toHexStringWithPrefix(num) {
    const hexStr = Number(num).toString(16);
    return hexStr.startsWith('0x') ? hexStr : '0x' + (hexStr.length === 1 ? '0' + hexStr : hexStr);
}

function get_length(content) {
    let total_length = 0;
    content.split('\n').forEach(line => {
        if (line.indexOf('sdowrite_') !== -1) {
            total_length += (countSubstrings(line, "float") * 4 + countSubstrings(line, "int8") * 1 + countSubstrings(line, "int16") * 2 + countSubstrings(line, "int32") * 4)
        }
    })
    return total_length
}

function countSubstrings(target, subStr) {
    if (subStr.length === 0) {
        return 0;
    }

    let count = 0;
    let pos = target.indexOf(subStr);

    while (pos !== -1) {
        count++;
        pos = target.indexOf(subStr, pos + subStr.length);
    }

    return count;
}

function get_dji_motor_report_id(ctrl_id, motor_id) {
    switch (ctrl_id) {
        case '0x200': {
            return 0x200 + motor_id
        }
        case '0x2ff':
        case '0x2fe':
        case '0x1fe': {
            return 0x204 + motor_id
        }
        case '0x1ff': {
            if (motor_id >= 1 && motor_id <= 4) {
                return 0x204 + motor_id
            } else {
                return 0x200 + motor_id
            }
        }
    }
}

function append_item(indentation, key, type, value) {
    return `${'  '.repeat(indentation)}${key}: !${type} ${type === 'std::string' ? '\'' : ''}${value}${type === 'std::string' ? '\'' : ''}\n`
}

export function generateModuleDef(module) {
    let res = ''
    let sdo_length = 0
    let pdowrite_offset = 0
    let pdoread_offset = 0

    res += append_item(3, 'task_count', 'uint8_t', module.task.length)
    res += append_item(3, 'latency_pub_topic', 'std::string', module.latency_topic)
    res += '\n      tasks:\n'

    for (let i = 1; i <= module.task.length; i++) {
        const task_info = module.task[i - 1]
        res += `        - app_${i}:\n`
        res += `            sdowrite_task_type: !uint8_t ${task_info.type}\n`
        if ('connection_lost_read_action' in task_info) {
            // for master use only
            res += `            conf_connection_lost_read_action: !uint8_t ${toHexStringWithPrefix(task_info.connection_lost_read_action)}\n`
        }
        if ('connection_lost_write_action' in task_info) {
            res += `            sdowrite_connection_lost_write_action: !uint8_t ${toHexStringWithPrefix(task_info.connection_lost_write_action)}\n`
        }
        if ('read_topic' in task_info) {
            res += `            pub_topic: !std::string '${task_info.read_topic || `/ecat/sn${module.sn}/app${i}/read`}'\n`
            res += `            pdoread_offset: !uint16_t ${pdoread_offset}\n`
        }
        if ('write_topic' in task_info) {
            res += `            sub_topic: !std::string '${task_info.write_topic || `/ecat/sn${module.sn}/app${i}/write`}'\n`
            res += `            pdowrite_offset: !uint16_t ${pdowrite_offset}\n`
        }

        switch (task_info.type) {
            // dji rc
            case 0x01: {
                pdoread_offset += 19
                break
            }
            // lk motor
            case 0x02: {
                res += append_item(6, 'sdowrite_control_period', 'uint16_t', task_info.control_period)
                if (Number(task_info.control_type) !== 0x08) {
                    res += append_item(6, 'sdowrite_can_packet_id', 'uint32_t', toHexStringWithPrefix(Number(task_info.motor_id) + 0x140))
                }
                res += append_item(6, 'sdowrite_can_inst', 'uint8_t', task_info.can_inst)
                res += append_item(6, 'sdowrite_control_type', 'uint8_t', task_info.control_type)

                if (Number(task_info.control_type) !== 0x08) {
                    pdoread_offset += 8
                } else {
                    pdoread_offset += 32
                }

                switch (Number(task_info.control_type)) {
                    case 0x01:
                    case 0x02: {
                        pdowrite_offset += 3
                        break
                    }
                    case 0x03: {
                        pdowrite_offset += 7
                        break
                    }
                    case 0x04: {
                        pdowrite_offset += 5
                        break
                    }
                    case 0x05: {
                        pdowrite_offset += 7
                        break
                    }
                    case 0x06: {
                        pdowrite_offset += 6
                        break
                    }
                    case 0x07: {
                        pdowrite_offset += 8
                        break
                    }
                    case 0x08: {
                        pdowrite_offset += 8
                        break
                    }
                }
                break
            }
            // hipnuc imu can
            case 3: {
                res += append_item(6, 'sdowrite_can_inst', 'uint8_t', task_info.can_inst)
                res += append_item(6, 'sdowrite_packet1_id', 'uint32_t', toHexStringWithPrefix(`0x${task_info.packet1_id}`))
                res += append_item(6, 'sdowrite_packet2_id', 'uint32_t', toHexStringWithPrefix(`0x${task_info.packet2_id}`))
                res += append_item(6, 'sdowrite_packet3_id', 'uint32_t', toHexStringWithPrefix(`0x${task_info.packet3_id}`))
                res += append_item(6, 'conf_frame_name', 'std::string', task_info.frame_name)

                pdoread_offset += (8 + 8 + 5)
                break
            }
            // dshot600
            case 4: {
                res += append_item(6, 'sdowrite_dshot_id', 'uint8_t', task_info.dshot_id)
                res += append_item(6, 'sdowrite_init_value', 'uint16_t', task_info.init_value)

                pdowrite_offset += 8
                break
            }
            // dji motor
            case 5: {
                res += append_item(6, 'sdowrite_control_period', 'uint16_t', task_info.control_period)
                res += append_item(6, 'sdowrite_can_packet_id', 'uint32_t', toHexStringWithPrefix(task_info.can_packet_id))
                res += append_item(6, 'sdowrite_motor1_can_id', 'uint32_t', task_info.motor_enable[0] ? toHexStringWithPrefix(get_dji_motor_report_id(toHexStringWithPrefix(task_info.can_packet_id), task_info.motor_id[0])) : 0)
                res += append_item(6, 'sdowrite_motor2_can_id', 'uint32_t', task_info.motor_enable[1] ? toHexStringWithPrefix(get_dji_motor_report_id(toHexStringWithPrefix(task_info.can_packet_id), task_info.motor_id[1])) : 0)
                res += append_item(6, 'sdowrite_motor3_can_id', 'uint32_t', task_info.motor_enable[2] ? toHexStringWithPrefix(get_dji_motor_report_id(toHexStringWithPrefix(task_info.can_packet_id), task_info.motor_id[2])) : 0)
                res += append_item(6, 'sdowrite_motor4_can_id', 'uint32_t', task_info.motor_enable[3] ? toHexStringWithPrefix(get_dji_motor_report_id(toHexStringWithPrefix(task_info.can_packet_id), task_info.motor_id[3])) : 0)
                res += append_item(6, 'sdowrite_can_inst', 'uint8_t', task_info.can_inst)

                let pdoread_len = 0
                let pdowrite_len = 0
                for (let j = 1; j <= 4; j++) {
                    if (!task_info.motor_enable[j - 1]) {
                        continue;
                    }
                    pdoread_len += 9
                    pdowrite_len += 3

                    res += append_item(6, `sdowrite_motor${j}_control_type`, 'uint8_t', task_info.motor_control_type[j - 1])
                    if (task_info.motor_control_type[j - 1] > 1) {
                        res += append_item(6, `sdowrite_motor${j}_speed_pid_kp`, 'float', task_info.motor_speed_pid_param[j - 1].kp)
                        res += append_item(6, `sdowrite_motor${j}_speed_pid_ki`, 'float', task_info.motor_speed_pid_param[j - 1].ki)
                        res += append_item(6, `sdowrite_motor${j}_speed_pid_kd`, 'float', task_info.motor_speed_pid_param[j - 1].kd)
                        res += append_item(6, `sdowrite_motor${j}_speed_pid_max_out`, 'float', task_info.motor_speed_pid_param[j - 1].maxout)
                        res += append_item(6, `sdowrite_motor${j}_speed_pid_max_iout`, 'float', task_info.motor_speed_pid_param[j - 1].maxiout)
                    }
                    if (task_info.motor_control_type[j - 1] > 2) {
                        res += append_item(6, `sdowrite_motor${j}_angle_pid_kp`, 'float', task_info.motor_angle_pid_param[j - 1].kp)
                        res += append_item(6, `sdowrite_motor${j}_angle_pid_ki`, 'float', task_info.motor_angle_pid_param[j - 1].ki)
                        res += append_item(6, `sdowrite_motor${j}_angle_pid_kd`, 'float', task_info.motor_angle_pid_param[j - 1].kd)
                        res += append_item(6, `sdowrite_motor${j}_angle_pid_max_out`, 'float', task_info.motor_angle_pid_param[j - 1].maxout)
                        res += append_item(6, `sdowrite_motor${j}_angle_pid_max_iout`, 'float', task_info.motor_angle_pid_param[j - 1].maxiout)
                    }
                }

                pdoread_offset += pdoread_len
                pdowrite_offset += pdowrite_len
                break
            }
            // onboard pwm
            case 6: {
                res += append_item(6, 'sdowrite_port_id', 'uint8_t', task_info.port_id)
                res += append_item(6, 'sdowrite_pwm_period', 'uint16_t', task_info.expected_period)
                res += append_item(6, 'sdowrite_init_value', 'uint16_t', task_info.init_value)

                pdowrite_offset += 8
                break
            }
            // external pwm
            case 7: {
                res += `            sdowrite_uart_id: !uint8_t ${task_info.uart_id}\n`
                res += `            sdowrite_pwm_period: !uint16_t ${task_info.expected_period}\n`
                res += `            sdowrite_channel_num: !uint8_t ${task_info.enabled_channel_count}\n`
                res += `            sdowrite_init_value: !uint16_t ${task_info.init_value}\n`

                pdowrite_offset += (task_info.enabled_channel_count * 2)
                break
            }
            // ms5876 30ba
            case 8: {
                res += `            sdowrite_i2c_id: !uint8_t ${task_info.i2c_id}\n`
                res += `            sdowrite_osr_id: !uint8_t ${task_info.osr_id}\n`

                pdoread_offset += 9
                break
            }
            // adc
            // case 9: {
            //     res += `            sdowrite_channel1_coefficient_per_volt: !float ${task_info.coefficient0}\n`
            //     res += `            sdowrite_channel2_coefficient_per_volt: !float ${task_info.coefficient1}\n`
            //     res += `            pub_topic: !std::string '${task_info.read_topic || `/ecat/sn${module.sn}/app${i}/read`}'\n`
            //     res += `            pdoread_offset: !uint16_t ${pdoread_offset}\n`
            //
            //     sdo_length += 9
            //     pdoread_offset += 8
            //     break
            // }
            // can pmu
            case 10: {
                pdoread_offset += 7
                break
            }
            // sbus
            case 11: {
                pdoread_offset += 24
                break
            }
            // dm motor
            case 12: {
                res += append_item(6, 'sdowrite_control_period', 'uint16_t', task_info.control_period)
                res += append_item(6, 'sdowrite_can_id', 'uint16_t', toHexStringWithPrefix(`0x${task_info.can_id}`))
                res += append_item(6, 'sdowrite_master_id', 'uint16_t', toHexStringWithPrefix(`0x${task_info.master_id}`))
                res += append_item(6, 'sdowrite_can_inst', 'uint8_t', task_info.can_inst)
                res += append_item(6, 'sdowrite_control_type', 'uint8_t', task_info.control_type)
                res += append_item(6, 'conf_pmax', 'float', task_info.pmax)
                res += append_item(6, 'conf_vmax', 'float', task_info.vmax)
                res += append_item(6, 'conf_tmax', 'float', task_info.tmax)

                pdoread_offset += 9
                if (task_info.control_type === 0x01 || task_info.control_type === 0x02) {
                    pdowrite_offset += 9
                } else if (task_info.control_type === 0x03) {
                    pdowrite_offset += 5
                }
                break
            }
            // super cap
            case 13: {
                res += append_item(6, 'sdowrite_can_inst', 'uint8_t', task_info.can_inst)
                res += append_item(6, 'sdowrite_chassis_to_cap_id', 'uint32_t', toHexStringWithPrefix(`0x${task_info.chassis_to_cap_id}`))
                res += append_item(6, 'sdowrite_cap_to_chassis_id', 'uint32_t', toHexStringWithPrefix(`0x${task_info.cap_to_chassis_id}`))

                pdoread_offset += 7
                pdowrite_offset += 4
                break
            }
            case 14: {
                pdoread_offset += 18
            }
        }
    }

    res = res.replaceAll('\r', '')
    res = append_item(3, 'sdo_len', 'uint16_t', get_length(res) + 1) + res
    res = `  - sn${module.sn}:\n` + res

    return {
        configuration: res + '\n',
        sdo_length: sdo_length + 1,
        pdoread_offset: pdoread_offset,
        pdowrite_offset: pdowrite_offset,
        sn: module.sn,
        type: module.type
    }
}
