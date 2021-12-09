<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/logo.png" height="240"></a>
</p>

<h1 align="center">
Homebridge Xiaomi Aqara AC Cooler</h1>

<p align="center">
    <a href="README.md"><font size=4><b>简体中文</b></font></a>
    <font size=4><b>·</b></font>
    <a href="README_EN.md"><font size=4><b>English</b></font></a>
</p>

<p align="center"> <a href=""><img src="https://img.shields.io/npm/dy/homebridge-xiaomi-aqara-ac-cooler"></a> <a href=""><img src="https://img.shields.io/github/package-json/v/seanzhang98/homebridge-xiaomi-aqara-ac-cooler"></a> <a href=""><img src="https://img.shields.io/github/languages/top/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler"></a></p>

A [Homebridge](https://github.com/nfarina/homebridge) plugin for  / XiaoMi / Aqara AC partner

With homebridge-config-ui-x support

## Functions

### Control
- Only keeps the Cool mode
- Temperature
  - 17 - 30 degress
- Wind Speed
  - 1 : Low
  - 2 : medium
  - 3 : high
  - 4 : auto
- swing
- light
  - only when `enableLED` set to true
  - as a light accessory

<img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/tmp.PNG" width = "500" align=center />


### Display

- Sync AC partner's status
- Idel / working
  - idel : green
  - cooling : blue
- ratedPower（in percentage）
  - when `ratedPower` setup
  - show as「battery」
- Current temp/humid
  - when `sensorId` was setup

<img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/con.PNG" width = "500" align=center />

## Installation

```bash
npm i -g miio@0.14.1 homebridge-xiaomi-aqara-ac-cooler
```

## Config

Get the token and IP address for the AC partner 

Use the Config UI to setup

<img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/Config.png" width = "1500" align=center />

