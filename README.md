<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/logo.png" height="240"></a>
</p>

<h1 align="center">
Homebridge Xiaomi Aqara AC Cooler</h1>

![npm](https://img.shields.io/npm/dy/homebridge-xiaomi-aqara-ac-cooler) ![npm](https://img.shields.io/npm/v/homebridge-xiaomi-aqara-ac-cooler)

适用于 米家 / Aqara 空调伴侣的 [Homebridge](https://github.com/nfarina/homebridge) 插件

支援 homebridge-config-ui-x 进行配置

## 功能

### 控制
- 仅保留制冷模式
- 温度
  - 17 - 30 度
- 风速
  - 1 : 低
  - 2 : 中
  - 3 : 高
  - 4 : 自动
- 摆动
- 灯光
  - 仅当 `enableLED` 为 true 时
  - 作为单独的灯光配件

<img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/tmp.PNG" width = "500" align=center />


### 显示

- 空调伴侣状态同步
- 空闲 / 工作 颜色区分
  - 空闲 : 绿
  - 制冷 : 蓝
- 当前功率（百分比）
  - 仅当设定了 `ratedPower`（额定功率）时
  - 作为「电池电量」显示
- 当前温、湿度
  - 仅当指定了温湿度传感器的 `sensorId` 时
  - 湿度集成在空调内，不以单独传感器显示

<img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/con.PNG" width = "500" align=center />

## 安装

```bash
npm i -g miio@0.14.1 homebridge-xiaomi-aqara-ac-cooler
```

## 配置

首先需要获取空调伴侣的token 以及 IP 地址

然后使用 Config UI 进行配置

<img src="https://raw.githubusercontent.com/seanzhang98/homebridge-Xiaomi-Aqara-AC-Cooler/master/images/Config.png" width = "1500" align=center />

或者在 Homebridge 的 config.json 中加入如下配置：

```json
"accessories": [
  {
    "accessory": "MiHeaterCooler",
    "name": "AC Partner",
    "address": "192.168.1.154",
    "Manufacturer": "Aqara",
    "Model": "KTBL11LM",
    "token": "71b4e85d8527aab32c8f9175124c0d59",
    "sensorId": "158d0001a4c582",
    "enableLED": false,
    "ratedPower": 735
  }
]
```

| 参数 | 描述 | 必须配置 |
|-|-|:-:|
| `accessory`  | "MiHeaterCooler"                              | ✓ |
| `name`       | 名称唯一                                       | ✓ |
| `address`    | 空调伴侣的 ip 地址                              | ✓ |
| `token`      | 执行 `miio --discover` 命令获取, 或者使用[Get_MiHome_devices_token](https://github.com/Maxmudjon/Get_MiHome_devices_token)                | ✓ |
| `Manufacturer`  | 用于显示设备生产商信息，默认为Aqara       | ✓ |
| `Model`  | 用于显示设备型号信息，默认为二代空调伴侣       | ✓ |
| `sensorId`   | 温湿度传感器 (必须绑定到此空调伴侣) id。执行 `miio --control 空调伴侣ip --method get_device_prop --params '["lumi.0", "device_list"]'` 命令获取（去除 'lumi.' 前缀）||
| `enableLED`  | true 或 'true'                                ||
| `ratedPower` | 瓦，空调额定功率，用于以「电池电量」显示当前功率百分比 ||
| `idlePower`  | 瓦，用于判定当前是否处于空闲状态，默认值为 100       ||


## 其它

自动支持大部分品牌的第一套预设方案

否则, 你可以用 Android 模拟器（如 [BlueStacks](http://www.bluestacks.com)）和抓包工具 [Wireshark](https://www.wireshark.org) 抓取并分析空调伴侣的命令码（执行 `miio --token 空调伴侣token --json-dump 报文` 命令获取），然后修改位于插件目录下的 `template.json` 文件

```json
{
  "010500378033333102": {
    "tpl": "0180333331${p}${m}${w}${s}${th}${l}2",
    "brand": "haier",
    "set": "1"
  }
}
```

主键是空调伴侣的 model，执行 `miio --control 空调伴侣ip --method get_model_and_state` 命令获取

tpl 是该 model 的命令模板，用 ES6 模板字符串编写，可用以下变量：

```js
/**
 * 生成命令码
 *
 * 如果你的方案下空调伴侣发出的命令形如 01xxxxxxxxpmwstlx（正如大部分品牌第一套预设方案一样）
 * 则无须此配置
 *
 * 用 ES6 模板字符串编写
 * 支持 +, -, *, /, %, ?:, [], toString(16) 等运算
 *
 * @param p  number 开关 0 : 关, 1 : 开
 * @param m  number 模式 0 : 制热, 1 : 制冷, 2 : 自动
 * @param w  number 风速 0 : 低, 1 : 中, 2 : 高, 3 : 自动
 * @param s  number 摆动 0 : 关, 1 : 开
 * @param td number 温度 十进制
 * @param th string 温度 十六进制
 * @param l  string 灯光 '0' : 开, 'a' : 关
 */
```
