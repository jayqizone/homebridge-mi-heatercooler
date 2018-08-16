# homebridge-mi-heatercooler

[![npm version](https://badge.fury.io/js/homebridge-mi-heatercooler.svg)](https://badge.fury.io/js/homebridge-mi-heatercooler)

English | [中文](https://github.com/jayqizone/homebridge-mi-heatercooler/blob/master/README-CN.md)

Mi / Aqara AC partner plugin for [Homebridge](https://github.com/nfarina/homebridge)

## Feature

### Control

- Mode
  - heat
  - cool
  - auto
- Temperature
  - 17 - 30 Celsius
- Fan speed
  - 1 : low
  - 2 : medium
  - 3 : high
  - 4 : auto
- Oscillate
- LED
  - only if set `enableLED` in config
  - would add a bulb accessory in Home app

![](https://raw.githubusercontent.com/jayqizone/homebridge-mi-heatercooler/master/images/control.PNG)

### Display

- Sync state with AC partner
- Idle / Working color
  - idle : green
  - heating : orange
  - cooling : blue
- Current power percent
  - only if set `ratedPower` in config
  - display as Battery Level
- Current temperature & humidity
  - only if set `sensorId` in config
  - would add a humidity sensor in Home app

![](https://raw.githubusercontent.com/jayqizone/homebridge-mi-heatercooler/master/images/state.PNG)

## Installation

```bash
npm i -g miio@0.14.1 homebridge homebridge-mi-heatercooler
```

## Configuration

First, you should enable ac partner's developer mode in MiHome app

Then, add this to config.json in Homebridge directory:

```json
"accessories": [
  {
    "accessory": "MiHeaterCooler",
    "name": "AC Partner",
    "address": "192.168.1.154",
    "token": "71b4e85d8527aab32c8f9175124c0d59",
    "sensorId": "158d0001a4c582",
    "enableLED": true,
    "ratedPower": 735
  }
]
```

| Parameter | Description | Required |
|-|-|:-:|
| `accessory`  | "MiHeaterCooler"                                                                     | ✓ |
| `name`       | unique name                                                                          | ✓ |
| `address`    | your AC partner ip address                                                           | ✓ |
| `token`      | run `miio --discover` to get it                                                      | ✓ |
| `sensorId`   | humidity-temperature sensor (bound to your AC partner) id. run `miio --control yourACPartnerIP --method get_device_prop --params '["lumi.0", "device_list"]'` to get it (without 'lumi.' prefix) ||
| `enableLED`  | true or 'true' to enable LED control                                                 ||
| `ratedPower` | Watt, your AC Normal Rated Power, used for displaying power percent by battery level ||
| `idlePower`  | Watt, determine whether current working state is idle, default value is 100          ||

## Extra

Auto supports most of brands set 1 solution

Otherwise, you should use an Android simulator (like [BlueStacks](http://www.bluestacks.com)) and [Wireshark](https://www.wireshark.org) to collect and analyze your AC partner command codes by `miio --token yourACPartnerToken --json-dump packetFile`, then modify `template.json` in plugin directory

```json
{
  "010500378033333102": {
    "tpl": "0180333331${p}${m}${w}${s}${th}${l}2",
    "brand": "haier",
    "set": "1"
  }
}
```

The key is your current AC partner solution model, you can get it by `miio --control yourACPartnerIP --method get_model_and_state`

"tpl" is this model's command template, you can use ES6 Template Literals with these params:

```js
/**
 * generate command
 *
 * if your ac partner sends commands like 01xxxxxxxxpmwstlx (most of brands set 1 do)
 * then you don't need template config
 *
 * template uses ES6 Template Literals to generate commands
 * supports +, -, *, /, %, ?:, [], toString(16) and so on
 *
 * @param p  number power       0 : off, 1 : on
 * @param m  number mode        0 : heat, 1 : cool, 2 : auto
 * @param w  number wind speed  0 : low, 1 : medium, 2 : high, 3 : auto
 * @param s  number swing       0 : enabled, 1 : disabled
 * @param td number temperature decimal
 * @param th string temperature hexadecimal
 * @param l  string led         '0' : on, 'a' : off
 */
```