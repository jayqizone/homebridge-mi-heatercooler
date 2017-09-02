# homebridge-mi-heatercooler

[![npm version](https://badge.fury.io/js/homebridge-mi-heatercooler.svg)](https://badge.fury.io/js/homebridge-mi-heatercooler)

Mi / Aqara AC Partner plugin for [Homebridge](https://github.com/nfarina/homebridge)

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

### Display

- Sync state with AC Partner
- Idle / Working color
  - idle : green
  - heating : orange
  - cooling : blue
- Current power Percent
  - if set ratedPower in config
  - display as Battery Level
- Current temperature & humidity
  - if set sensorId in config
  - would add a humidity sensor in Home app

## Installation

```
npm i -g miio homebridge homebridge-mi-heatercooler
```

## Configuration

```
"accessories": [
  {
    "accessory": "MiHeaterCooler",
    "token": "71b4e85d8527aab32c8f9175124c0d59",
    "name": "AC Partner",
    "address": "192.168.1.154",
    "sensorId": "158d0001a4c582",
    "ratedPower": 735
  }
]
```

|  Parameter  |                                     Description                                     |Required|
|-------------|-------------------------------------------------------------------------------------|:------:|
|`accessory`  |"MiHeaterCooler"                                                                     |    ✓   |
|`token`      |run `miio --discover` to get it                                                      |    ✓   |
|`name`       |unique name                                                                          |    ✓   |
|`address`    |your AC partner ip address                                                           |    ✓   |
|`sensorId`   |humidity-temperature sensor (bound to your AC partner) id. run `miio --control yourACPartnerIP --method get_device_prop --params '["lumi.0", "device_list"]'` to get it (without 'lumi.' prefix)            |        |
|`ratedPower` |Watt, your AC Normal Rated Power, used for displaying power percent by battery level |        |
|`idlePower`  |Watt, determine whether current working state is idle, default value is 100          |        |
