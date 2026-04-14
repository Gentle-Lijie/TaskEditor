<template>
  <div>
    <el-divider><span>Add Module</span></el-divider>
    <div style="text-align: center">
      <!-- deprecated -->
      <!--      <el-button @click="modules.push({type: 0x01, task: []})">Flight Module</el-button>-->
      <!--      <el-button @click="modules.push({type: 0x02, task: [], latency_topic: '', sn: ''})" disabled>Motor Module</el-button>-->
      <el-button @click="modules.push({type: 0x03, task: [], latency_topic: '', sn: ''})">H750 Universal Module
      </el-button>
      <el-button @click="modules.push({type: 0x04, task: [], latency_topic: '', sn: ''})">H750 Universal Module (Large
        PDO V.)
      </el-button>
    </div>

    <el-divider>
      <span>
        Module List
      </span>
    </el-divider>
    <div>

      <el-table
          :data="modules"
          border
          style="width: 100%">

        <el-table-column type="expand">
          <template slot-scope="props">
            <div>
              <div class="text item with_margin_bottom" style="margin: 30px">
                <el-divider content-position="left">Add Task</el-divider>
                <el-button @click="props.row.task.push(deepClone(examples.djirc))">DJI RC</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.djivt13))">DJI VT13</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.sbus_rc))">SBUS RC</el-button>

                <el-divider direction="vertical"/>
                <el-button @click="props.row.task.push(deepClone(examples.hipnucimu_can))">HIPNUC IMU(CAN)</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.super_cap))">SUPER CAP(CAN)</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.ms5837_30ba))">MS5837(30BA)</el-button>
                <!--                <el-button @click="props.row.task.push(deepClone(examples.adc))">OnBoard ADC *UNTESTED</el-button>-->
                <el-button @click="props.row.task.push(deepClone(examples.can_pmu))">PMU(CAN)</el-button>

                <el-divider direction="vertical"/>
                <el-button @click="props.row.task.push(deepClone(examples.djican))">DJI Motor</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.dm_motor))">DM Motor</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.lktech))">LkTech Motor</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.ddmotor))">DD Motor</el-button>

                <el-divider direction="vertical"/>
                <el-button @click="props.row.task.push(deepClone(examples.dshot))">DSHOT600</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.vanilla_pwm))">OnBoard PWM</el-button>
                <el-button @click="props.row.task.push(deepClone(examples.external_pwm))">ExternalBoard PWM</el-button>

                <el-divider content-position="left">Module Task Detail Configuration</el-divider>
                <el-table
                    :data="props.row.task"
                    border
                    style="width: 100%">

                  <el-table-column type="expand">
                    <template slot-scope="props2">

                      <!-- DJI RC -->
                      <div v-if="props2.row.type === 1">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="false"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="DJI RC"/>

                            <el-divider content-position="left">ROS2 Message Definition - DJI RC</el-divider>
                            <ReadDJIRC/>
                          </el-form>
                        </div>
                      </div>

                      <!-- LkTech Motor -->
                      <div v-if="props2.row.type === 0x02">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <control-period-input :row="props2.row"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">CAN Configuration</el-divider>
                            <can-selector :row="props2.row"/>

                            <el-alert
                                :closable="false"
                                style="margin-bottom: 20px;"
                                type="info"
                            >
                              <template slot="title">
                                If you are using broadcast mode, ignore this column as the driver ID will be fixed to
                                1-4 in this mode.
                              </template>
                            </el-alert>
                            <el-form-item label="Motor Driver ID">
                              <el-input-number :min="1" :max="32" v-model="props2.row.motor_id"
                                               :disabled="props2.row.control_type === 0x08"/>
                            </el-form-item>

                            <el-divider content-position="left">Motor Configuration</el-divider>
                            <el-alert
                                :closable="false"
                                style="margin-bottom: 20px;"
                                type="info"
                            >
                              <template slot="title">
                                More information about LkTech Motor Protocol can be cound at <a
                                  href="http://www.lkmotor.cn/Download.aspx?ClassID=47">http://www.lkmotor.cn/Download.aspx?ClassID=47</a>
                              </template>
                            </el-alert>
                            <el-form-item label="Control Type">
                              <el-radio-group v-model="props2.row.control_type" style="width: 100%"
                                              @change="()=>{if (props2.row.control_type === 0x08) {props2.row.motor_id = 1}}">
                                <el-divider>Broadcast mode</el-divider>
                                <el-radio :label="0x08">Current</el-radio>

                                <el-divider>Single motor mode</el-divider>
                                <el-radio :label="0x01">Openloop Current</el-radio>
                                <br>
                                <el-radio :label="0x02" style="margin-top: 5px">Torque</el-radio>
                                <br>
                                <el-radio :label="0x03" style="margin-top: 5px">Speed With Torque Limit</el-radio>
                                <br>
                                <el-radio :label="0x04" style="margin-top: 5px">Multi-Round Position</el-radio>
                                <br>
                                <el-radio :label="0x05" style="margin-top: 5px">Multi-Round Position With Speed Limit
                                </el-radio>
                                <br>
                                <el-radio :label="0x06" style="margin-top: 5px">Single-Round Position</el-radio>
                                <br>
                                <el-radio :label="0x07" style="margin-top: 5px">Single-Round Position With Speed Limit
                                </el-radio>
                              </el-radio-group>
                            </el-form-item>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="Motor Feedback"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Feedback</el-divider>
                            <ReadLkMotor v-if="props2.row.control_type !== 0x08"/>
                            <ReadLkMotorMulti v-else/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Control Command
                            </el-divider>

                            <WriteLkMotorOpenloopControl v-if="props2.row.control_type === 0x01"/>
                            <WriteLkMotorTorqueControl v-else-if="props2.row.control_type === 0x02"/>
                            <WriteLkMotorSpeedControlWithTorqueLimit v-else-if="props2.row.control_type === 0x03"/>
                            <WriteLkMotorMultiRoundPositionControl v-else-if="props2.row.control_type === 0x04"/>
                            <WriteLkMotorMultiRoundPositionControlWithSpeedLimit
                                v-else-if="props2.row.control_type === 0x05"/>
                            <WriteLkMotorSingleRoundPositionControl v-else-if="props2.row.control_type === 0x06"/>
                            <WriteLkMotorSingleRoundPositionControlWithSpeedLimit
                                v-else-if="props2.row.control_type === 0x07"/>
                            <WriteLkMotorBroadcastCurrentControl v-else-if="props2.row.control_type === 0x08"/>
                          </el-form>
                        </div>
                      </div>

                      <!-- HIPNUC IMU (CAN) -->
                      <div v-if="props2.row.type === 3">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">CAN Configuration</el-divider>
                            <can-selector :row="props2.row"/>
                            <hex-input field="packet1_id" :row="props2.row" label="Packet1 ID"/>
                            <hex-input field="packet2_id" :row="props2.row" label="Packet2 ID"/>
                            <hex-input field="packet3_id" :row="props2.row" label="Packet3 ID"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <el-form-item label="Frame name">
                              <el-input v-model="props2.row.frame_name"></el-input>
                            </el-form-item>

                            <ros2-topic-name-input
                                :sub="false"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="HIPNUC IMU"/>

                            <el-divider content-position="left">ROS2 Message Definition - HIPNUC IMU</el-divider>
                            <el-form-item label="Message Type" style="margin: 0">
                              <el-tag>sensor_msgs/Imu</el-tag>
                            </el-form-item>
                            <el-divider/>
                          </el-form>
                        </div>
                      </div>

                      <!-- DSHOT -->
                      <div v-if="props2.row.type === 4">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>

                            <el-divider content-position="left">TIM Configuration</el-divider>

                            <port-selector :row="props2.row" field="dshot_id"/>
                            <number-input field="init_value" :row="props2.row" label="Initial Value" unit="us"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="false"
                                :row="props2"
                                :sn="props.row.sn"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Control Command
                            </el-divider>
                            <WriteDSHOT/>
                          </el-form>
                        </div>
                      </div>

                      <!-- DJI Motor -->
                      <div v-if="props2.row.type === 0x05">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">

                            <el-divider content-position="left">Task Configuration</el-divider>
                            <control-period-input :row="props2.row"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">CAN Configuration</el-divider>
                            <can-selector :row="props2.row"/>

                            <el-form-item class="havetag" label="Motor Control Packet ID">
                              <el-radio-group v-model="props2.row.can_packet_id">
                                <el-radio :label="0x200" style="padding-bottom: 5px">0x200
                                  <el-tag size="small" style="margin-left: 10px">3508 ID1-4</el-tag>
                                  <el-tag size="small">2006 ID1-4</el-tag>
                                </el-radio>
                                <br/>

                                <el-radio :label="0x1ff" style="padding-bottom: 5px">0x1ff
                                  <el-tag size="small" style="margin-left: 18px">3508 ID5-8</el-tag>
                                  <el-tag size="small">2006 ID5-8</el-tag>
                                  <el-tag size="small" type="success">6020 VOLT_CTRL ID1-4</el-tag>
                                </el-radio>
                                <br/>

                                <el-radio :label="0x2ff" style="padding-bottom: 5px">0x2ff
                                  <el-tag size="small" style="margin-left: 18px" type="success">6020 VOLT_CTRL ID5-7
                                  </el-tag>
                                </el-radio>
                                <br/>

                                <el-radio :label="0x1fe" style="padding-bottom: 5px">0x1fe
                                  <el-tag size="small" style="margin-left: 13.5px" type="warning">6020 CURR_CTRL ID1-4
                                  </el-tag>
                                </el-radio>
                                <br/>

                                <el-radio :label="0x2fe" style="padding-bottom: 5px">0x2fe
                                  <el-tag size="small" style="margin-left: 13.5px" type="warning">6020 CURR_CTRL ID5-7
                                  </el-tag>
                                </el-radio>
                              </el-radio-group>
                            </el-form-item>

                            <div v-for="i in [1, 2, 3, 4]" :key="i">
                              <el-form-item :label="`Motor${i} Enable`" style="margin: 0">
                                <el-switch v-model="props2.row.motor_enable[i-1]"/>
                              </el-form-item>
                              <el-form-item v-show="props2.row.motor_enable[i-1]" :label="`Motor${i} ID`"
                                            style="margin: 0">
                                <el-radio-group v-model="props2.row.motor_id[i-1]">
                                  <el-radio :label="1">1</el-radio>
                                  <el-radio :label="2">2</el-radio>
                                  <el-radio :label="3">3</el-radio>
                                  <el-radio :label="4">4</el-radio>
                                  <el-radio :label="5">5</el-radio>
                                  <el-radio :label="6">6</el-radio>
                                  <el-radio :label="7">7</el-radio>
                                  <el-radio :label="8">8</el-radio>
                                </el-radio-group>
                              </el-form-item>
                            </div>

                            <el-divider content-position="left">Motor Configuration</el-divider>
                            <el-alert
                                :closable="false"
                                style="margin-bottom: 20px;"
                                type="info"
                            >
                              <template slot="title">
                                More information about DJI Motor Protocol can be cound at <a
                                  href="https://www.robomaster.com/zh-CN/products/components/general">https://www.robomaster.com/zh-CN/products/components/general</a>
                              </template>
                            </el-alert>

                            <div v-for="i in [1, 2, 3, 4]" :key="i*5">
                              <el-form-item v-show="props2.row.motor_enable[i-1]" :label="`Motor${i} Control Type`"
                                            style="margin: 0">
                                <el-radio-group v-model="props2.row.motor_control_type[i-1]">
                                  <el-radio :label="0x01">Openloop Current</el-radio>
                                  <el-radio :label="0x02">Speed</el-radio>
                                  <el-radio :label="0x03">Single-Round Position</el-radio>
                                </el-radio-group>
                              </el-form-item>

                              <el-form-item
                                  v-show="props2.row.motor_enable[i-1] && props2.row.motor_control_type[i-1] > 1"
                                  :label="`Motor${i} Speed PID Parameters`"
                                  style="margin: 0">
                                <el-form class="no_margin_bottom" label-position="left" label-width="50%" size="small">
                                  <number-input field="kp" :row="props2.row.motor_speed_pid_param[i-1]"
                                                label="Speed PID Kp"/>
                                  <number-input field="ki" :row="props2.row.motor_speed_pid_param[i-1]"
                                                label="Speed PID Ki"/>
                                  <number-input field="kd" :row="props2.row.motor_speed_pid_param[i-1]"
                                                label="Speed PID Kd"/>
                                  <number-input field="maxout" :row="props2.row.motor_speed_pid_param[i-1]"
                                                label="Speed PID Max Out"/>
                                  <number-input field="maxiout" :row="props2.row.motor_speed_pid_param[i-1]"
                                                label="Speed PID Max IOut"/>
                                </el-form>
                              </el-form-item>

                              <el-form-item
                                  v-show="props2.row.motor_enable[i-1] && props2.row.motor_control_type[i-1] > 2"
                                  :label="`Motor${i} Angle PID Parameters`"
                                  style="margin: 0">
                                <el-form class="no_margin_bottom" label-position="left" label-width="50%" size="small">
                                  <number-input field="kp" :row="props2.row.motor_angle_pid_param[i-1]"
                                                label="Angle PID Kp"/>
                                  <number-input field="ki" :row="props2.row.motor_angle_pid_param[i-1]"
                                                label="Angle PID Ki"/>
                                  <number-input field="kd" :row="props2.row.motor_angle_pid_param[i-1]"
                                                label="Angle PID Kd"/>
                                  <number-input field="maxout" :row="props2.row.motor_angle_pid_param[i-1]"
                                                label="Angle PID Max Out"/>
                                  <number-input field="maxiout" :row="props2.row.motor_angle_pid_param[i-1]"
                                                label="Angle PID Max IOut"/>
                                </el-form>
                              </el-form-item>
                            </div>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="Motor Feedback"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Feedback</el-divider>
                            <ReadDJIMotor/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Control Command
                            </el-divider>
                            <WriteDJIMotor/>

                          </el-form>
                        </div>
                      </div>

                      <!-- OnBoard PWM -->
                      <div v-else-if="props2.row.type === 6">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>

                            <el-divider content-position="left">TIM Configuration</el-divider>
                            <port-selector :row="props2.row" field="port_id"/>

                            <number-input field="expected_period" :row="props2.row" label="Period" unit="us"/>
                            <number-input field="init_value" :row="props2.row" label="Initial Value" unit="us"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="false"
                                :row="props2"
                                :sn="props.row.sn"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Control Command
                            </el-divider>
                            <WriteOnBoardPWM/>
                          </el-form>
                        </div>
                      </div>

                      <!-- ExternalBoard PWM -->
                      <div v-if="props2.row.type === 7">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">

                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>

                            <el-form-item label="UART" style="margin: 0">
                              <el-radio-group v-model="props2.row.uart_id">
                                <el-radio :label="1">UART1</el-radio>
                                <el-radio :label="4">UART4</el-radio>
                              </el-radio-group>
                            </el-form-item>

                            <el-form-item label="Enabled Channel Count" style="margin: 0">
                              <el-input-number v-model="props2.row.enabled_channel_count" :min="1"
                                               :max="16"/>
                            </el-form-item>

                            <number-input field="expected_period" :row="props2.row" label="Period" unit="us"/>
                            <number-input field="init_value" :row="props2.row" label="Initial Value" unit="us"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="false"
                                :row="props2"
                                :sn="props.row.sn"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor
                              Control Command
                            </el-divider>
                            <WriteExternalPWM/>
                          </el-form>
                        </div>
                      </div>

                      <!-- MS5837(30BA) -->
                      <div v-if="props2.row.type === 8">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>

                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-form-item label="I2C" style="margin: 0">
                              <el-radio-group v-model="props2.row.i2c_id">
                                <el-radio :label="3">I2C3</el-radio>
                              </el-radio-group>
                            </el-form-item>

                            <el-form-item label="OSR ID" style="margin: 0">
                              <el-input-number v-model="props2.row.osr_id" :min="1" :max="6"/>
                            </el-form-item>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="false"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="MS5837(30BA)"/>

                            <el-divider content-position="left">ROS2 Message Definition - MS5837(30BA)</el-divider>
                            <ReadMS5837BA30/>
                          </el-form>
                        </div>
                      </div>

                      <!-- OnBoard ADC -->
                      <!--                      <div v-if="props2.row.type === 9">-->
                      <!--                        <div class="text item" style="margin: 30px">-->
                      <!--                          <el-form label-position="left" label-width="50%" size="small">-->

                      <!--                            <el-divider content-position="left">ADC Configuration</el-divider>-->

                      <!--                            <el-form-item label="Coefficient for channel 1" style="margin: 0">-->
                      <!--                              <el-input v-model="props2.row.coefficient0"-->
                      <!--                                        @input="(v)=>(props2.row.coefficient0=v.replace(/^\D*(\d*(?:\.\d{0,})?).*$/g, '$1'))"/>-->
                      <!--                            </el-form-item>-->

                      <!--                            <el-form-item label="Coefficient for channel 2" style="margin: 0">-->
                      <!--                              <el-input v-model="props2.row.coefficient1"-->
                      <!--                                        @input="(v)=>(props2.row.coefficient1=v.replace(/^\D*(\d*(?:\.\d{0,})?).*$/g, '$1'))"/>-->
                      <!--                            </el-form-item>-->

                      <!--                            <el-divider content-position="left">ROS2 Configuration</el-divider>-->
                      <!--                            <el-form-item label="Onboard ADC Publisher Topic Name" style="margin: 0">-->
                      <!--                              <el-input v-model="props2.row.read_topic"-->
                      <!--                                        :placeholder="`/ecat/sn${props.row.sn}/app${props2.$index+1}/read`"></el-input>-->
                      <!--                            </el-form-item>-->

                      <!--                            <el-divider content-position="left">ROS2 Message Definition - Onboard ADC-->
                      <!--                            </el-divider>-->
                      <!--                            <el-form-item label="Message Type" style="margin: 0">-->
                      <!--                              <el-tag>custom_msgs/ReadADC</el-tag>-->
                      <!--                            </el-form-item>-->
                      <!--                            <el-divider/>-->
                      <!--                            <el-form-item class="havetag" label="header" style="margin: 0">-->
                      <!--                              <el-tag size="small">std_msgs/Header</el-tag>-->
                      <!--                            </el-form-item>-->
                      <!--                            <el-form-item class="havetag" label="channel1" style="margin: 0">-->
                      <!--                              <el-tag size="small">float32</el-tag>-->
                      <!--                            </el-form-item>-->
                      <!--                            <el-form-item class="havetag" label="channel2" style="margin: 0">-->
                      <!--                              <el-tag size="small">float32</el-tag>-->
                      <!--                            </el-form-item>-->
                      <!--                          </el-form>-->
                      <!--                        </div>-->
                      <!--                      </div>-->

                      <!-- PMU (CAN) -->
                      <div v-else-if="props2.row.type === 10">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="false"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="PMU(CAN)"/>

                            <el-divider content-position="left">ROS2 Message Definition - PMU</el-divider>
                            <ReadCANPMU/>
                          </el-form>
                        </div>
                      </div>

                      <!-- SBUS RC -->
                      <div v-else-if="props2.row.type === 11">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">
                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="false"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="SBUS RC"/>

                            <el-divider content-position="left">ROS2 Message Definition - SBUS RC</el-divider>
                            <ReadSBUSRC/>
                          </el-form>
                        </div>
                      </div>

                      <!-- DM MOTOR -->
                      <div v-else-if="props2.row.type === 12">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">

                            <el-divider content-position="left">Task Configuration</el-divider>
                            <control-period-input :row="props2.row"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">CAN Configuration</el-divider>

                            <can-selector :row="props2.row"/>
                            <hex-input field="can_id" :row="props2.row" label="CAN ID"/>
                            <hex-input field="master_id" :row="props2.row" label="Master ID"/>

                            <el-divider content-position="left">Motor Configuration</el-divider>
                            <el-alert
                                :closable="false"
                                style="margin-bottom: 20px;"
                                type="info"
                            >
                              <template slot="title">
                                More information about DM Motor Protocol can be cound at <a
                                  href="https://gl1po2nscb.feishu.cn/wiki/MZ32w0qnnizTpOkNvAZcJ9SlnXb">https://gl1po2nscb.feishu.cn/wiki/MZ32w0qnnizTpOkNvAZcJ9SlnXb</a>
                              </template>
                            </el-alert>

                            <el-form-item label="Control Type">
                              <el-radio-group v-model="props2.row.control_type">
                                <el-radio :label="0x01">MIT</el-radio>
                                <el-radio :label="0x02">Position With Speed Limit</el-radio>
                                <el-radio :label="0x03">Speed</el-radio>
                              </el-radio-group>
                            </el-form-item>

                            <el-alert
                                :closable="false"
                                style="margin-bottom: 5px;"
                                type="info"
                            >
                              <template slot="title">
                                Please set the <u><b>PMax</b></u> to <u><b>PI</b></u> using the DMTools software for
                                best ecd accuracy.
                              </template>
                            </el-alert>
                            <el-form-item label="PMax">
                              <el-input
                                  v-model="props2.row.pmax"
                                  disabled
                              />
                            </el-form-item>
                            <number-input field="vmax" :row="props2.row" label="VMax"/>
                            <number-input field="tmax" :row="props2.row" label="TMax"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="Motor Feedback"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Feedback</el-divider>
                            <ReadDmMotor/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Control Command
                            </el-divider>
                            <WriteDmMotorMITControl v-if="props2.row.control_type === 0x01"/>
                            <WriteDmMotorPositionControlWithSpeedLimit v-else-if="props2.row.control_type === 0x02"/>
                            <WriteDmMotorSpeedControl v-else-if="props2.row.control_type === 0x03"/>
                          </el-form>
                        </div>
                      </div>

                      <!-- SUPER CAP -->
                      <div v-else-if="props2.row.type === 13">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">

                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">CAN Configuration</el-divider>

                            <can-selector :row="props2.row"/>
                            <hex-input field="chassis_to_cap_id" :row="props2.row" label="Capacitor Control Packet ID"/>
                            <hex-input field="cap_to_chassis_id" :row="props2.row" label="Capacitor Report Packet ID"/>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="Capacitor Feedback"
                                sub-label="Capacitor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Capacitor Feedback
                            </el-divider>
                            <ReadSuperCap/>

                            <el-divider content-position="left">ROS2 Message Definition - Capacitor Control Command
                            </el-divider>
                            <WriteSuperCap/>
                          </el-form>
                        </div>
                      </div>
                      <!--VT13-->
                      <div v-else-if="props2.row.type === 14">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">

                            <el-divider content-position="left">Task Configuration</el-divider>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>
                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="false"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="DJI VT13"/>

                            <el-divider content-position="left">ROS2 Message Definition - DJI VT13
                            </el-divider>
                            <ReadVT13/>
                          </el-form>
                        </div>
                      </div>

                      <!-- DD MOTOR -->
                      <div v-if="props2.row.type === 15">
                        <div class="text item" style="margin: 30px">
                          <el-form label-position="left" label-width="50%" size="small">

                            <el-divider content-position="left">Task Configuration</el-divider>
                            <control-period-input :row="props2.row"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_write_action"
                                                             label="Control"/>
                            <connection-lost-action-selector v-model="props2.row.connection_lost_read_action"
                                                             label="Report"/>

                            <el-divider content-position="left">CAN Configuration</el-divider>
                            <can-selector :row="props2.row" :showBaudrate="false"/>

                            <el-form-item label="CAN Baudrate">
                              <el-radio-group v-model="props2.row.can_type">
                                <el-radio :label="1">1M</el-radio>
                                <el-radio :label="2">500K</el-radio>
                              </el-radio-group>
                            </el-form-item>

                            <el-form-item class="havetag" label="Motor Control Packet ID">
                              <el-radio-group v-model="props2.row.can_packet_id">
                                <el-radio :label="0x32" style="padding-bottom: 5px">0x32
                                  <el-tag size="small" style="margin-left: 10px">ID1-4</el-tag>
                                </el-radio>
                                <br/>

                                <el-radio :label="0x33" style="padding-bottom: 5px">0x33
                                  <el-tag size="small" style="margin-left: 10px">ID5-8</el-tag>
                                </el-radio>
                                <br/>
                              </el-radio-group>
                            </el-form-item>

                            <div v-for="i in [1, 2, 3, 4]" :key="i">
                              <el-form-item :label="`Motor${i} Enable`" style="margin: 0">
                                <el-switch v-model="props2.row.motor_enable[i-1]"/>
                              </el-form-item>
                              <el-form-item v-show="props2.row.motor_enable[i-1]" :label="`Motor${i} ID`"
                                            style="margin: 0">
                                <el-radio-group v-model="props2.row.motor_id[i-1]">
                                  <el-radio :label="1">1</el-radio>
                                  <el-radio :label="2">2</el-radio>
                                  <el-radio :label="3">3</el-radio>
                                  <el-radio :label="4">4</el-radio>
                                  <el-radio :label="5">5</el-radio>
                                  <el-radio :label="6">6</el-radio>
                                  <el-radio :label="7">7</el-radio>
                                  <el-radio :label="8">8</el-radio>
                                </el-radio-group>
                              </el-form-item>
                            </div>

                            <el-divider content-position="left">Motor Configuration</el-divider>

                            <div v-for="i in [1, 2, 3, 4]" :key="i*5">
                              <el-form-item v-show="props2.row.motor_enable[i-1]" :label="`Motor${i} Control Type`"
                                            style="margin: 0">
                                <el-radio-group v-model="props2.row.motor_control_type[i-1]">
                                  <el-radio :label="0x01">Openloop Voltage</el-radio>
                                  <el-radio :label="0x02">Closedloop Current</el-radio>
                                  <el-radio :label="0x03">Speed</el-radio>
                                  <el-radio :label="0x04">Single-Round Position</el-radio>
                                </el-radio-group>
                              </el-form-item>

                            </div>

                            <el-divider content-position="left">ROS2 Configuration</el-divider>
                            <ros2-topic-name-input
                                :sub="true"
                                :pub="true"
                                :row="props2"
                                :sn="props.row.sn"
                                pub-label="Motor Feedback"
                                sub-label="Motor Command"/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Feedback</el-divider>
                            <ReadDDMotor/>

                            <el-divider content-position="left">ROS2 Message Definition - Motor Control Command
                            </el-divider>
                            <WriteDDMotor/>

                          </el-form>
                        </div>
                      </div>

                    </template>
                  </el-table-column>

                  <el-table-column
                      label="Task Type">
                    <template slot-scope="props2">
                      {{ getAppTypeFriendlyName(props2.row.type) }}
                    </template>
                  </el-table-column>

                  <el-table-column
                      label="Operations">
                    <template slot-scope="props2">
                      <el-button @click="props.row.task.splice(props2.$index, 1)">Remove</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
            label="Module Type">
          <template slot-scope="props">
            {{ getTypeFriendlyName(props.row.type) }}
          </template>
        </el-table-column>

        <el-table-column
            label="Module SN">
          <template slot-scope="props">
            <el-input v-model="props.row.sn" @input="(val) => {props.row.latency_topic = `/ecat/sn${val}/latency`}"/>
          </template>
        </el-table-column>

        <el-table-column
            label="Module Latency Topic">
          <template slot-scope="props">
            <el-input v-model="props.row.latency_topic"/>
          </template>
        </el-table-column>

        <el-table-column
            label="Operations">
          <template slot-scope="props">
            <el-button @click="removeModule(props.$index)">Remove</el-button>
          </template>
        </el-table-column>
      </el-table>

    </div>
  </div>
</template>

<script>

import ConnectionLostActionSelector from "@/components/ConnectionLostActionSelector.vue";
import ReadDmMotor from "@/components/message_types/ReadDmMotor.vue";
import ReadSBUSRC from "@/components/message_types/ReadSBUSRC.vue";
import WriteDSHOT from "@/components/message_types/WriteDSHOT.vue";
import WriteOnBoardPWM from "@/components/message_types/WriteOnBoardPWM.vue";
import WriteDJIMotor from "@/components/message_types/WriteDJIMotor.vue";
import WriteDDMotor from "@/components/message_types/WriteDDMotor.vue";
import WriteExternalPWM from "@/components/message_types/WriteExternalPWM.vue";
import ReadDJIMotor from "@/components/message_types/ReadDJIMotor.vue";
import ReadDDMotor from "@/components/message_types/ReadDDMotor.vue";
import WriteDmMotorMITControl from "@/components/message_types/WriteDmMotorMITControl.vue";
import WriteDmMotorSpeedControl from "@/components/message_types/WriteDmMotorSpeedControl.vue";
import WriteDmMotorPositionControlWithSpeedLimit
  from "@/components/message_types/WriteDmMotorPositionControlWithSpeedLimit.vue";
import Ros2TopicNameInput from "@/components/Ros2TopicNameInput.vue";
import HexInput from "@/components/HexInput.vue";
import CanSelector from "@/components/CanSelector.vue";
import ControlPeriodInput from "@/components/ControlPeriodInput.vue";
import NumberInput from "@/components/NumberInput.vue";
import PortSelector from "@/components/PortSelector.vue";
import ReadDJIRC from "@/components/message_types/ReadDJIRC.vue";
import ReadVT13 from "@/components/message_types/ReadVT13RC.vue"
import ReadLkMotor from "@/components/message_types/ReadLkMotor.vue";
import WriteLkMotorOpenloopControl from "@/components/message_types/WriteLkMotorOpenloopControl.vue";
import WriteLkMotorBroadcastCurrentControl from "@/components/message_types/WriteLkMotorBroadcastCurrentControl.vue";
import ReadLkMotorMulti from "@/components/message_types/ReadLkMotorMulti.vue";
import ReadMS5837BA30 from "@/components/message_types/ReadMS5837BA30.vue";
import WriteLkMotorTorqueControl from "@/components/message_types/WriteLkMotorTorqueControl.vue";
import WriteLkMotorMultiRoundPositionControl
  from "@/components/message_types/WriteLkMotorMultiRoundPositionControl.vue";
import WriteLkMotorMultiRoundPositionControlWithSpeedLimit
  from "@/components/message_types/WriteLkMotorMultiRoundPositionControlWithSpeedLimit.vue";
import WriteLkMotorSingleRoundPositionControlWithSpeedLimit
  from "@/components/message_types/WriteLkMotorSingleRoundPositionControlWithSpeedLimit.vue";
import ReadSuperCap from "@/components/message_types/ReadSuperCap.vue";
import WriteSuperCap from "@/components/message_types/WriteSuperCap.vue";
import ReadCANPMU from "@/components/message_types/ReadCANPMU.vue";

export default {
  name: 'NewTaskAssignment',
  components: {
    ReadCANPMU,
    WriteLkMotorSingleRoundPositionControlWithSpeedLimit,
    WriteLkMotorMultiRoundPositionControlWithSpeedLimit,
    WriteLkMotorMultiRoundPositionControl,
    WriteLkMotorTorqueControl,
    WriteLkMotorOpenloopControl,
    WriteLkMotorBroadcastCurrentControl,
    ReadLkMotorMulti,
    ReadLkMotor,
    ReadDJIRC,
    ReadVT13,
    PortSelector,
    ReadMS5837BA30,
    NumberInput,
    CanSelector,
    HexInput,
    Ros2TopicNameInput,
    ControlPeriodInput,
    WriteExternalPWM,
    ConnectionLostActionSelector,
    ReadDmMotor,
    WriteDSHOT,
    WriteDJIMotor,
    ReadDJIMotor,
    WriteDmMotorMITControl,
    WriteDmMotorSpeedControl,
    WriteDmMotorPositionControlWithSpeedLimit,
    ReadSBUSRC,
    WriteOnBoardPWM,
    WriteSuperCap,
    ReadSuperCap,
    ReadDDMotor,
    WriteDDMotor
  },
  data() {
    return {
      examples: {
        // read = slv to mst
        // write = mst to slv
        djirc: {
          type: 0x01,
          read_topic: '',
          connection_lost_read_action: 0x01,
        },
        djivt13: {
          type: 14,
          read_topic: '',
          connection_lost_read_action: 0x01,
        },
        sbus_rc: {
          type: 11,
          read_topic: '',
          connection_lost_read_action: 0x01,
        },
        lktech: {
          type: 0x02,
          can_inst: 1,
          motor_id: 1,
          can_packet_id: 0x141,
          control_period: 1,
          control_type: 0x01,
          read_topic: '',
          write_topic: '',
          connection_lost_read_action: 0x01,
          connection_lost_write_action: 0x01
        },
        hipnucimu_can: {
          type: 0x03,
          read_topic: '',
          frame_name: 'imu_link',
          can_inst: 1,
          packet1_id: '01',
          packet2_id: '02',
          packet3_id: '03',
          connection_lost_read_action: 0x01
        },
        dshot: {
          type: 0x04,
          dshot_id: 1,
          write_topic: '',
          init_value: 0,
          connection_lost_write_action: 0x01
        },
        djican: {
          type: 0x05,
          can_inst: 1,
          can_packet_id: 0x200,
          control_period: 1,
          motor_enable: [true, true, true, true],
          motor_id: [1, 2, 3, 4],
          motor_control_type: [0x01, 0x01, 0x01, 0x01],
          connection_lost_read_action: 0x01,
          connection_lost_write_action: 0x01,
          motor_speed_pid_param: [
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            },
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            },
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            },
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            }
          ],
          motor_angle_pid_param: [
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            },
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            },
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            },
            {
              kp: 1,
              ki: 0,
              kd: 0,
              maxout: 10000,
              maxiout: 1000
            }
          ],
          read_topic: '',
          write_topic: '',
        },
        vanilla_pwm: {
          type: 6,
          port_id: 1,
          expected_period: 0,
          init_value: 0,
          write_topic: '',
          connection_lost_write_action: 0x01,
        },
        external_pwm: {
          type: 7,
          uart_id: 1,
          expected_period: 0,
          enabled_channel_count: 1,
          init_value: 0,
          write_topic: '',
          connection_lost_write_action: 0x01,
        },
        ms5837_30ba: {
          type: 8,
          i2c_id: 3,
          osr_id: 1,
          read_topic: '',
          connection_lost_read_action: 0x01,
        },
        adc: {
          type: 9,
          coefficient0: 0,
          coefficient1: 0,
          read_topic: '',
          connection_lost_read_action: 0x01,
        },
        can_pmu: {
          type: 10,
          read_topic: '',
          connection_lost_read_action: 0x01,
        },
        dm_motor: {
          type: 12,
          can_inst: 1,
          can_id: '01',
          master_id: '11',
          control_period: 1,
          control_type: 1,
          pmax: 3.141592653589793,
          vmax: 30,
          tmax: 10,
          connection_lost_read_action: 0x01,
          connection_lost_write_action: 0x01,
          read_topic: '',
          write_topic: ''
        },
        super_cap: {
          type: 13,
          can_inst: 1,
          chassis_to_cap_id: '01',
          cap_to_chassis_id: '02',
          connection_lost_read_action: 0x01,
          connection_lost_write_action: 0x01,
          read_topic: '',
          write_topic: ''
        },
        ddmotor: {
          type: 15,
          can_inst: 1,
          can_type: 1,
          can_packet_id: 0x32,
          control_period: 1,
          motor_enable: [true, true, true, true],
          motor_id: [1, 2, 3, 4],
          motor_control_type: [0x01, 0x01, 0x01, 0x01],
          connection_lost_read_action: 0x01,
          connection_lost_write_action: 0x01,
          read_topic: '',
          write_topic: '',
        },
      },
      modules: [],
    }
  },
  watch: {
    modules: {
      handler(newVal) {
        localStorage.setItem("modules_info", JSON.stringify(newVal));
      },
      deep: true
    }
  },
  mounted() {
    if (localStorage.getItem("modules_info") != null) {
      this.modules = JSON.parse(localStorage.getItem("modules_info"));
    }
  },
  methods: {
    getTypeFriendlyName(hexId) {
      switch (hexId) {
          // deprecated
          // case 0x01:
          //   return "Flight Module"
          // case 0x02:
          //   return "Motor Module"
        case 0x03:
          return "H750 Universal Module"
        case 0x04:
          return "H750 Universal Module (Large PDO V.)"
      }
    },
    getAppTypeFriendlyName(hexId) {
      switch (hexId) {
        case 1:
          return "DJI RC"
        case 2:
          return "LkTech Motor"
        case 3:
          return "HIPNUC IMU(CAN)"
        case 4:
          return "DSHOT600"
        case 5:
          return "DJI Motor"
        case 6:
          return "OnBoard PWM"
        case 7:
          return "External PWM"
        case 8:
          return "MS5837(30BA)"
        case 9:
          return "ADC"
        case 10:
          return "PMU(CAN)"
        case 11:
          return "SBUS RC"
        case 12:
          return "DM Motor"
        case 13:
          return "Super Capacitor"
        case 14:
          return "DJI VT13"
        case 15:
          return "DD Motor"
      }
    },
    removeModule(idx) {
      this.modules.splice(idx, 1);
    },
    deepClone(source) {
      if (!source && typeof source !== 'object') {
        throw new Error('error arguments', 'deepClone')
      }
      const targetObj = source.constructor === Array ? [] : {}
      Object.keys(source).forEach(keys => {
        if (source[keys] && typeof source[keys] === 'object') {
          targetObj[keys] = this.deepClone(source[keys])
        } else {
          targetObj[keys] = source[keys]
        }
      })
      return targetObj
    }
  }
}
</script>

<style>
.no_margin_bottom > .el-form-item {
  margin-bottom: 0 !important;
}

.with_margin_bottom > .el-button {
  margin-bottom: 10px;
}
</style>
