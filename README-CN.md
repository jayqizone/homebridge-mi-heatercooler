# homebridge-mi-heatercooler

[![npm version](https://badge.fury.io/js/homebridge-mi-heatercooler.svg)](https://badge.fury.io/js/homebridge-mi-heatercooler)

适用于 Mi / Aqara 空调伴侣的 [Homebridge](https://github.com/nfarina/homebridge) 插件

## 功能

### 控制

- 模式
  - 制热
  - 制冷
  - 自动
- 温度
  - 17 - 30 度
- 风速
  - 1 : 低
  - 2 : 中
  - 3 : 高
  - 4 : 自动
- 摆动
- 灯光
  - 仅当 enableLED 为 true 时
  - 作为单独的灯光配件

![](https://raw.githubusercontent.com/jayqizone/homebridge-mi-heatercooler/master/images/control.PNG)

### 显示

- 空调伴侣状态同步
- 空闲 / 工作 颜色区分
  - 空闲 : 绿
  - 制热 : 橙
  - 制冷 : 蓝
- 当前功率（百分比）
  - 仅当设定了 ratedPower（额定功率）时
  - 作为「电池电量」显示
- 当前温、湿度
  - 仅当指定了温湿度传感器的 sensorId 时
  - 湿度作为单独的传感器

![](https://raw.githubusercontent.com/jayqizone/homebridge-mi-heatercooler/master/images/state.PNG)

## 安装

```bash
npm i -g miio@0.14.1 homebridge homebridge-mi-heatercooler
```

## 配置

首先需要在「米家 app」中打开空调伴侣的开发者模式

然后在 Homebridge 的 config.json 中加入如下配置：

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

| 参数 | 描述 | Required |
|-|-|:-:|
| `accessory`  | "MiHeaterCooler"                              | ✓ |
| `name`       | 名称唯一                                       | ✓ |
| `address`    | 空调伴侣的 ip 地址                              | ✓ |
| `token`      | 执行 `miio --discover` 命令获取                 | ✓ |
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
