const miio = require('miio');
const template = require('./template');
let Accessory, Service, Characteristic;

module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-mi-heatercooler', 'MiHeaterCooler', MiHeaterCooler);
}

class MiHeaterCooler {
    constructor(log, config) {
        this.log = log;

        /* config */
        this.name = config.name || 'AC Partner';
        this.token = config.token;
        this.address = config.address;
        this.enableLED = config.enableLED + '' === 'true'; // enable led control
        this.sensorId = config.sensorId; // humidity-temperature-pressure sensor id
        this.ratedPower = config.ratedPower; // Watt, used for fake BatteryService
        this.idlePower = config.idlePower || 100; // Watt, determine whether CurrentHeaterCoolerState is idle
        this.cmdTimeout = config.cmdTimeout || 50; // millisecond, async send timeout
        this.syncInterval = config.syncInterval || 5000; // millisecond, sync interval

        /* used for auto mode */
        this.targetTemperature = 26;

        /* characteristics */
        this.Active;
        this.TargetHeaterCoolerState;
        this.CoolingThresholdTemperature;
        this.HeatingThresholdTemperature;
        this.SwingMode;
        this.RotationSpeed;

        this.CurrentHeaterCoolerState;
        this.CurrentTemperature;

        this.LED;
        this.CurrentRelativeHumidity;
        this.ChargingState; // Characteristic.ChargingState.CHARGING so far, means wired
        this.BatteryLevel; // display power by this, equals 100 * power / this.ratedPower

        /* used for generating commands */
        this.model;
        this.template;

        /* command timeout Handle */
        this.cmdHandle;

        /* while sending commands, not sync */
        this.syncLock = false;

        /* miio device */
        this.device;

        this.services = [];

        this.addServices();

        this.bindCharacteristics();

        this.init();
    }

    addServices() {
        this.acService = new Service.HeaterCooler(this.name);
        this.services.push(this.acService);

        if (this.enableLED) {
            this.ledService = new Service.Lightbulb(this.name);
            this.services.push(this.ledService);
        }

        if (this.sensorId) {
            this.humidityService = new Service.HumiditySensor(this.name);
            this.services.push(this.humidityService);
        }

        if (this.ratedPower) {
            this.powerService = new Service.BatteryService(this.name);
            this.services.push(this.powerService);
        }

        this.serviceInfo = new Service.AccessoryInformation();

        this.serviceInfo
            .setCharacteristic(Characteristic.Manufacturer, 'Mi')
            .setCharacteristic(Characteristic.Model, 'Heater Cooler')
            .setCharacteristic(Characteristic.SerialNumber, this.address);
        this.services.push(this.serviceInfo);
    }

    bindCharacteristics() {
        this.Active = this.acService.getCharacteristic(Characteristic.Active)
            .on('set', this._setActive.bind(this));

        this.TargetHeaterCoolerState = this.acService.getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .on('set', this._setTargetHeaterCoolerState.bind(this));

        this.CoolingThresholdTemperature = this.acService.addCharacteristic(Characteristic.CoolingThresholdTemperature)
            .setProps({
                maxValue: 30,
                minValue: 18,
                minStep: 1
            })
            .on('set', this._setCoolingThresholdTemperature.bind(this))
            .updateValue(this.targetTemperature);

        this.HeatingThresholdTemperature = this.acService.addCharacteristic(Characteristic.HeatingThresholdTemperature)
            .setProps({
                maxValue: 30,
                minValue: 18,
                minStep: 1
            })
            .on('set', this._setHeatingThresholdTemperature.bind(this))
            .updateValue(this.targetTemperature);

        this.SwingMode = this.acService.addCharacteristic(Characteristic.SwingMode)
            .on('set', this._setSwingMode.bind(this));

        this.RotationSpeed = this.acService.addCharacteristic(Characteristic.RotationSpeed)
            .setProps({
                maxValue: 4,
                minValue: 0,
                minStep: 1
            })
            .on('set', this._setRotationSpeed.bind(this));

        this.CurrentHeaterCoolerState = this.acService.getCharacteristic(Characteristic.CurrentHeaterCoolerState);

        this.CurrentTemperature = this.acService.getCharacteristic(Characteristic.CurrentTemperature);

        if (this.enableLED) {
            this.LED = this.ledService.getCharacteristic(Characteristic.On)
                .on('set', this._setLED.bind(this));
        }

        if (this.sensorId) {
            this.CurrentRelativeHumidity = this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
        }

        if (this.ratedPower) {
            this.ChargingState = this.powerService.getCharacteristic(Characteristic.ChargingState);
            this.BatteryLevel = this.powerService.getCharacteristic(Characteristic.BatteryLevel);
        }
    }

    init() {
        miio.device({address: this.address, token: this.token})
            .then(device => {
                this.device = device;

                this.syncState();
            })
            .catch(err => this.log.error(err));
    }

    syncState() {
        let p1 = !this.syncLock && this.device.call('get_model_and_state')
            .then(list => {
                if (!this.syncLock) {
                    let model = list[0],
                        state = list[1],
                        power = list[2];

                    if (this.model !== model) {
                        this.model = model;
                        this.template = template[model];
                    }

                    let active, mode, speed, swing, temperature, led;

                    active = state.substr(2, 1) - 0;
                    speed = state.substr(4, 1) - 0 + 1;
                    swing = 1 - state.substr(5, 1);
                    temperature = parseInt(state.substr(6, 2), 16);
                    led = state.substr(8, 1);

                    this.targetTemperature = temperature;

                    switch (state.substr(3, 1)) {
                        case '2':
                            mode = Characteristic.TargetHeaterCoolerState.AUTO;
                            // keep the same temporarily
                            this.CoolingThresholdTemperature.updateValue(temperature);
                            this.HeatingThresholdTemperature.updateValue(temperature);
                            break;
                        case '1':
                            mode = Characteristic.TargetHeaterCoolerState.COOL;
                            this.CoolingThresholdTemperature.updateValue(temperature);
                            break;
                        case '0':
                            mode = Characteristic.TargetHeaterCoolerState.HEAT;
                            this.HeatingThresholdTemperature.updateValue(temperature);
                            break;
                    }

                    this.Active.updateValue(active);
                    this.TargetHeaterCoolerState.updateValue(mode);
                    this.RotationSpeed.updateValue(speed);
                    this.SwingMode.updateValue(swing);

                    if (power > this.idlePower) {
                        this.CurrentHeaterCoolerState.updateValue(this.TargetHeaterCoolerState.value + 1);
                    } else {
                        this.CurrentHeaterCoolerState.updateValue(Characteristic.CurrentHeaterCoolerState.IDLE);
                    }

                    if (this.enableLED) {
                        this.LED.updateValue(led === '0');
                    }

                    if (!this.sensorId) {
                        this.CurrentTemperature.updateValue(temperature);
                    }

                    if (this.ratedPower) {
                        this.ChargingState.updateValue(Characteristic.ChargingState.CHARGING);
                        this.BatteryLevel.updateValue((100 * power / this.ratedPower).toFixed(1));
                    }
                }
            });
        let p2 = this.sensorId && this.device.call('get_device_prop_exp', [['lumi.' + this.sensorId, 'temperature', 'humidity', 'pressure']])
            .then(list => {
                let props = list[0],
                    temperature = props[0],
                    humidity = props[1],
                    pressure = props[2];

                this.CurrentTemperature.updateValue((temperature / 100).toFixed(1));
                this.CurrentRelativeHumidity.updateValue((humidity / 100).toFixed(0));
            });

        Promise.all([p1, p2])
            .catch(err => this.log.error(err))
            .then(() => setTimeout(this.syncState.bind(this), this.syncInterval));
    }

    /* sometimes HomeKit sets several props at the same time, and thus sends command more than once. try to avoid it */
    sendCmdAsync() {
        this.syncLock = true;

        clearTimeout(this.cmdHandle);
        this.cmdHandle = setTimeout(this._sendCmd.bind(this), this.cmdTimeout);
    }

    _sendCmd() {
        this.syncLock = true;

        if (this.device) {
            let cmd;
            let active, mode, speed, swing, temperature, led;

            active = this.Active.value;
            speed = this.RotationSpeed.value - 1;
            swing = 1 - this.SwingMode.value;
            led = this.enableLED ? (this.LED.value ? '0' : 'a') : '1';

            switch (this.TargetHeaterCoolerState.value) {
                case Characteristic.TargetHeaterCoolerState.AUTO:
                    mode = 2;
                    temperature = this.targetTemperature;
                    break;
                case Characteristic.TargetHeaterCoolerState.COOL:
                    mode = 1;
                    temperature = this.CoolingThresholdTemperature.value;
                    break;
                case Characteristic.TargetHeaterCoolerState.HEAT:
                    mode = 0;
                    temperature = this.HeatingThresholdTemperature.value;
                    break;
            }

            cmd = this._genCmd(active, mode, speed, swing, temperature, temperature.toString(16), led);
            this.device.call('send_cmd', [cmd])
                .catch(err => this.log.error(err))
                .then(() => this.syncLock = false);
        } else {
            this.syncLock = false;
        }
    }

    /**
     * generate command
     *
     * if your ac partner sends commands like 01xxxxxxxxpmwstlx (most of brands set 1 do)
     * then you don't need template config
     *
     * template uses ES 6 Template Literals to generate commands
     * supports +, -, *, /, %, ?:, [], toString(16) and so on
     *
     * @param p number power, 0 : off, 1 : on
     * @param m number mode, 0 : heat, 1 : cool, 2 : auto
     * @param w number wind speed, 0 : low, 1 : medium, 2 : high, 3 : auto
     * @param s number swing, 0 : enabled, 1 : disabled
     * @param td number temperature, decimal
     * @param th string temperature, hexadecimal
     * @param l string led, '0' : on, 'a' : off
     */

    _toHex(b) {
        b = b - 0;
        let res = b.toString(16).toUpperCase();
        if (res.length == 1) {
            res = "0" + res;
        }
        return res;
    }

    _genCmd(p, m, w, s, td, th, l) {
        let cmd;

        if (this.template && this.template.tpl) {
            cmd = new Function('p, m, w, s, td, th, l', 'return `' + this.template.tpl + '`').apply(null, [p, m, w, s, td, th, l]);
        }
        else {
            cmd = this.model.substr(0, 2) + this.model.substr(8, 8)
                + p
                + m
                + w
                + s
                + th
                + l
                + this.model.substr(-1);
        }

        // Shinco
        if (this.model == "010515770001109201") {
            if (p == 0) {
                cmd = "010001109200311801005502000600801000ED";
            } else {
                let counter = 0x55;
                cmd += "0055";

                let t = td - 0;
                let tt = t + 0x70;
                cmd += this._toHex(tt);
                counter += tt;

                cmd += "00";
                
                let secret_map = {
                    0x1e: 0x1b,
                    0x1d: 0x1a,
                    0x1c: 0x18,
                    0x1b: 0x16,
                    0x1a: 0x14,
                    0x19: 0x13,
                    0x18: 0x11,
                    0x17: 0x10,
                    0x16: 0x0e,
                    0x15: 0x0c,
                    0x14: 0x0a,
                    0x13: 0x08,
                    0x12: 0x06
                };
                let secret = secret_map[t];
                cmd += this._toHex(secret);
                counter += secret;

                cmd += "00";

                let s_secret;
                if (s == 0) {
                    s_secret = 0x80;
                } else {
                    s_secret = 0x00;
                }
                cmd += this._toHex(s_secret);
                counter += s_secret;

                let m_secret_map = {
                    0: 0x40,
                    1: 0x10,
                    2: 0x0
                };
                let w_secret_map = {
                    0: 0x1,
                    1: 0x2,
                    2: 0x3,
                    3: 0x0
                };
                let m_secret = m_secret_map[m - 0];
                let w_secret = w_secret_map[w - 0];
                let mw_secret = m_secret + w_secret;
                cmd += this._toHex(mw_secret);
                counter += mw_secret;

                cmd += "00";
                cmd += this._toHex(counter & 0xFF);
            }
        }

        console.log("[debug] model: " + this.model + " => cmd: " + cmd);

        return cmd;
    }

    /* set characteristic methods */
    _setActive(Active, callback) {
        callback();

        this.sendCmdAsync();
    }

    _setTargetHeaterCoolerState(TargetHeaterCoolerState, callback) {
        callback();

        // update CurrentHeaterCoolerState
        this.CurrentHeaterCoolerState.updateValue(TargetHeaterCoolerState + 1);

        this.sendCmdAsync();
    }

    _setCoolingThresholdTemperature(CoolingThresholdTemperature, callback) {
        if (this.CoolingThresholdTemperature.value !== CoolingThresholdTemperature) {
            this.targetTemperature = CoolingThresholdTemperature
        }
        callback();

        // power on
        this.Active.updateValue(Characteristic.Active.ACTIVE);

        // update CurrentTemperature
        if (!this.sensorId) {
            this.CurrentTemperature.updateValue(CoolingThresholdTemperature);
        }

        this.sendCmdAsync();
    }

    _setHeatingThresholdTemperature(HeatingThresholdTemperature, callback) {
        if (this.HeatingThresholdTemperature.value !== HeatingThresholdTemperature) {
            this.targetTemperature = HeatingThresholdTemperature
        }
        callback();

        // power on
        this.Active.updateValue(Characteristic.Active.ACTIVE);

        // update CurrentTemperature
        if (!this.sensorId) {
            this.CurrentTemperature.updateValue(HeatingThresholdTemperature);
        }

        this.sendCmdAsync();
    }

    _setSwingMode(SwingMode, callback) {
        callback();

        this.sendCmdAsync();
    }

    _setRotationSpeed(RotationSpeed, callback) {
        callback();

        this.sendCmdAsync();
    }

    _setLED(LED, callback) {
        callback();

        this.sendCmdAsync();
    }

    /* framework interface */
    getServices() {
        return this.services;
    }
}
