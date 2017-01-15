var https = require('https');
var fs = require('fs');
var ca = fs.readFileSync('./cert/srca.cer.pem');
var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var scanf = require('scanf');
var program = require('commander');
var config = {};
program
  .version('0.0.1')
  .option('-r, --rewrite', 'rewrite config')
  .parse(process.argv);

fs.readFile('config.json','utf-8',function(err,data){
	if(err||!data||program.rewrite){
		// console.log(err);
		console.log('输入日期-time(如:2017-01-27)：');
		config.time = scanf('%s');

		console.log('输入车次-train_num(如:K1209)：');
		config.train_num = scanf('%s').split('|');

		console.log('输入始发站-from_station(如:SNH)：');
		config.from_station = scanf('%s');

		console.log('输入终点站-end_station(如:SRG)：');
		config.end_station = scanf('%s');

		console.log('输入邮箱-your_mail(如:123456789@163.com)：');
		config.your_mail = scanf('%s');

		console.log('输入密码或者邮箱授权码-mail_pass：');
		config.mail_pass = scanf('%s');

		// console.log(config);
		fs.writeFile('config.json',JSON.stringify(config));
	}else{
		// console.log(data);
		config = JSON.parse(data);
	}
	var rule = new schedule.RecurrenceRule();  
	rule.second = [0];
	schedule.scheduleJob(rule, function(){
		queryTickets(config);
        console.log('scheduleCronstyle:' + new Date());
	}); 
});
var yz_temp = [],yw_temp = [];//保存余票状态
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
    	var jsonMap = {};
    	for(var i=0;i<jsonData.length;i++){
    		var cur = jsonData[i];
    		jsonMap[cur.queryLeftNewDTO.station_train_code] = cur.queryLeftNewDTO;
    		
    	}
    	var train_arr = config.train_num;
    	for(var j = 0;j < train_arr.length;j++){
			var cur_train = jsonMap[train_arr[j]];
			if(!cur_train){
				console.log('当天没有'+train_arr[j]+'这趟车次');
				continue;
			}
			var yz = cur_train.yz_num;//硬座数目
			var yw = cur_train.yw_num;//硬卧数目
			var trainNum = cur_train.station_train_code;//车次
			console.log(trainNum+'硬座',yz);
			console.log(trainNum+'硬卧',yw);
			if(yz!='无'&&yz!='--'||yw!='无'&&yw!='--'){
				if(yw_temp[j] == yw && yz_temp[j] == yz){//当余票状态发生改变的时候就不发送邮件
					console.log(trainNum+'状态没改变，不重复发邮件');
					continue;
				}
				var mailOptions = {
				    from: config.your_mail, // 发件邮箱地址
				    to: config.your_mail, // 收件邮箱地址，可以和发件邮箱一样
				    subject: trainNum+'有票啦，硬座：'+yz+'，硬卧：'+yw, // 邮件标题
				    text: trainNum+'有票啦\n'+'时间是'+cur_train.start_train_date+',\n出发时间:'+cur_train.start_time+',\n到达时间:'+cur_train.arrive_time+',\n历时：'+cur_train.lishi+',\n始发站：'+cur_train.from_station_name+',\n到达：'+cur_train.to_station_name, // 邮件内容
				};

				// 发邮件部分
				(function(j,yz,yw){
					console.log(j,yw);
					transporter.sendMail(mailOptions, function(error, info){
					    if(error){
					        return console.log(error);
					    }
					    console.log('邮件已发送: ' + info.response);
					    yw_temp[j] = yw;//保存当前列车的余票数量
					    yz_temp[j] = yz;
					});
				})(j,yz,yw);
			}else{
				console.log(trainNum+'硬座/硬卧无票');
			}
    	}
    	// fs.writeFile('./train.json',data);
    })  
});

req.on('error', function(err){
    console.error(err.code);
});
}


