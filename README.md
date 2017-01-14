# node_12306
###适用场景：已经确定了火车的车次和时间（最好提前3-4天），但是没有座位了。想抢有座位的（只能抢别人的退票了，几天内一般都会有人退票）。
##使用方法：
  * 克隆代码到本地``` git clone https://github.com/hongrunhui/node_12306.git ``` 
  * 在当前文件夹终端``` npm install ```安装依赖
  * 配置```main.js``` 代码中config里的信息（车次信息，邮箱密码）
  * ```node main.js```
  
##注意：
  * config中的mail_pass字段可以写邮箱密码（前提是要去邮箱设置里开启smtp），还可以用邮箱授权码代替，这种方式更安全。具体可以见[wiki](https://github.com/hongrunhui/node_12306/wiki/%E9%82%AE%E7%AE%B1%E8%AE%A4%E8%AF%81%E9%94%99%E8%AF%AF%E8%A7%A3%E5%86%B3%E5%8A%9E%E6%B3%95)
