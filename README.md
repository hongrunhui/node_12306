# node_12306
## 目前已重新支持使用，如有功能需求建议，可在issue里提
## 适用场景：
已经确定了火车的车次和时间（最好提前3-4天），但是没有座位了。想抢有座位的（只能抢别人的退票了，几天内一般都会有人退票）。
## 使用方法：
  * 克隆代码到本地``` git clone https://github.com/hongrunhui/node_12306.git ``` 
  * 在当前文件夹终端``` npm install ```安装依赖
  * ```node main.js```，第一次运行会要求输入信息并且存入config.json，以后再次运行只会读取config.json中的数据，不会要求再次输入。如：<br/>
  ![image](https://cloud.githubusercontent.com/assets/9162319/24579567/816b61aa-172a-11e7-937b-84d7ff716a0e.png)
  * 运行结果如下：<br/>
  ![image](https://cloud.githubusercontent.com/assets/9162319/24579618/4979af30-172b-11e7-94b3-9feaa5053541.png)
  * ```node main.js -r```可以重写config.json(重新输入信息)。
  * ```node main.js -t```可以更新车站信息，当然也要看station_name.js的station_version。
  * 车次(```train_num```字段)可以输入多个车次，用|分开，如K123|K234(前提这些车次都在同一线路上)。
  * 12306检测到余票查询这个接口有大流量的时候，会更换余票查询的地址，所以才会报错，现在自动爬取这个地址，应该不会报错，输入的问题也解决了，后续研究研究怎么自动下单（不过要实现这个应该不简单= =，我工作也很忙呀）。
  
## 注意：
  * 要使用邮件功能前提是要去邮箱设置里开启smtp;也可以用邮箱授权码代替，这种方式更安全。具体可以见[wiki](https://github.com/hongrunhui/node_12306/wiki/%E9%82%AE%E7%AE%B1%E8%AE%A4%E8%AF%81%E9%94%99%E8%AF%AF%E8%A7%A3%E5%86%B3%E5%8A%9E%E6%B3%95)
  * 针对有人提出程序可能会报错退出的问题，这里建议使用[pm2](http://pm2.keymetrics.io/)来启动```main.js```,具体步骤：
 	  * ```npm install pm2 -g```全局安装pm2
 	  * ```[sudo] pm2 start main.js```启动程序（linux可能会需要管理员权限）
    * ```[sudo] pm2 list```列出当前程序的运行情况
    * ```[sudo] pm2 stop```停止程序
    * 大家可以放到自己的服务器上面去运行，这样全天24小时都可以监听你的车次还有没有票，并及时给你发邮件。
  * 有人提出自动抢票下单支付功能，这个我以后会想办法去实现。
  * [博客地址](http://www.cnblogs.com/hongrunhui/p/6284192.html)

## 声明
  * 本程序最适合监听那些一张票都没有的车次(或者无座多，硬座/软座/硬卧/软卧无的车次)，通过本程序可以24小时监听车次是否会多出余票，并及时发送邮件通知个人(可以使用```pm2```部署在自己的服务器上或24小时开着电脑运行实现24小时监听)
  * 对于有特殊需求的可以自己修改代码或者咨询我。