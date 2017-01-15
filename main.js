var https = require('https');
var fs = require('fs');
var ca = fs.readFileSync('./cert/srca.cer.pem');
var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var config = {
	time:'2017-01-21',//日期格式必须是这样
	from_station:'SNH',//始发站车站代码，这里是北京北
	end_station:'SRG',//厦门
	train_num:'K4671',//车次
	your_mail:'15755191035@163.com',//你自己的邮箱，我这里用的是163邮箱，如果你要改其他类型的邮箱的话，那请你修改transporter里的服务器信息
	mail_pass:'hongrunhui'//这个可以是密码也可以是邮箱的授权码，前提是开启邮箱的smtp服务，具体步骤可以看issue里，放心写吧
};
var yz_temp = '',yw_temp = '';//保存余票状态
function queryTickets(config){
	var options = { 
	    hostname: 'kyfw.12306.cn',//12306
	    path: '/otn/leftTicket/queryA?leftTicketDTO.train_date='+config.time+'&leftTicketDTO.from_station='+config.from_station+'&leftTicketDTO.to_station='+config.end_station+'&purpose_codes=ADULT',
	    ca:[ca]//证书
	};
	var req = https.get(options, function(res){ 
    var data = '';
    var transporter = nodemailer.createTransport({
	    host: "smtp.163.com",//邮箱的服务器地址，如果你要换其他类型邮箱（如QQ）的话，你要去找他们对应的服务器，
	    secureConnection: true,
	    port:465,//端口，这些都是163给定的，自己到网上查163邮箱的服务器信息
	    auth: {
	        user: config.your_mail,//邮箱账号
	        pass: config.mail_pass,//邮箱密码
	    }
	});
    res.on('data',function(buff){
    	data += buff;//查询结果（JSON格式）
    }); 
    res.on('end',function(){
    	// console.log('res',data);
    	var jsonData = JSON.parse(data).data;
    	for(var i=0;i<jsonData.length;i++){
    		var cur = jsonData[i];
    		if(cur.queryLeftNewDTO.station_train_code==config.train_num){
    			// console.log(cur);
    			var yz = cur.queryLeftNewDTO.yz_num;//硬座数目
    			var yw = cur.queryLeftNewDTO.yw_num;//硬卧数目
    			var trainNum = cur.queryLeftNewDTO.station_train_code;//车次
    			console.log('硬座',yz);
    			console.log('硬卧',yw);
    			if(yz!='无'&&yz!='--'||yw!='无'&&yw!='--'){
    				if(yw_temp == yw && yz_temp == yz){//当余票状态发生改变的时候就不发送邮件
    					console.log('状态没改变，不重复发邮件');
    					return;
    				}
					var mailOptions = {
					    from: config.your_mail, // 发件邮箱地址
					    to: config.your_mail, // 收件邮箱地址，可以和发件邮箱一样
					    subject: trainNum+'有票啦，硬座：'+yz+'，硬卧：'+yw, // 邮件标题
					    text: trainNum+'有票啦\n'+'时间是'+cur.queryLeftNewDTO.start_train_date+',\n出发时间:'+cur.queryLeftNewDTO.start_time+',\n到达时间:'+cur.queryLeftNewDTO.arrive_time+',\n历时：'+cur.queryLeftNewDTO.lishi+',\n始发站：'+cur.queryLeftNewDTO.from_station_name+',\n到达：'+cur.queryLeftNewDTO.to_station_name, // 邮件内容
					};

					// 发邮件部分
					transporter.sendMail(mailOptions, function(error, info){
					    if(error){
					        return console.log(error);
					    }
					    console.log('Message sent: ' + info.response);
					    yw_temp = yw;//保存当前列车的余票数量
					    yz_temp = yz;
					});
    			}else{
    				console.log('硬座/硬卧无票');
    			}
    			
    			break;
    		}
    	}
    	// fs.writeFile('./train.json',data);
    })  
});

req.on('error', function(err){
    console.error(err.code);
});
}
var rule = new schedule.RecurrenceRule();  
rule.second = [0];
schedule.scheduleJob(rule, function(){
		queryTickets(config);
        console.log('scheduleCronstyle:' + new Date());
}); 

