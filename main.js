var https = require('https');
var fs = require('fs');
var ca = fs.readFileSync('./cert/srca.cer.pem');
var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var config = {
	time:'2017-01-28',
	from_station:'SHH',
	end_station:'SRG'
};
var options = { 
    hostname: 'kyfw.12306.cn',
    path: '/otn/leftTicket/queryA?leftTicketDTO.train_date='+config.time+'&leftTicketDTO.from_station='+config.from_station+'&leftTicketDTO.to_station='+config.end_station+'&purpose_codes=ADULT',
    // rejectUnauthorized: false  // 忽略安全警告
    ca:[ca]
};
var yz_temp = '',yw_temp = '';
function queryTickets(){
	var req = https.get(options, function(res){ 
    // var data = res.pipe(process.stdout);
    var data = '';
    var transporter = nodemailer.createTransport({
	    //https://github.com/andris9/nodemailer-wellknown#supported-services 支持列表
	    host: "smtp.163.com",
	    secureConnection: true,
	    port:465,
	    auth: {
	        user: '15755191035@163.com',
	        pass: 'hongrunhui',
	    }
	});
    res.on('data',function(buff){
    	data += buff;
    }); 
    res.on('end',function(){
    	// console.log('res',data);
    	var jsonData = JSON.parse(data).data;
    	for(var i=0;i<jsonData.length;i++){
    		var cur = jsonData[i];
    		if(cur.queryLeftNewDTO.station_train_code=='K1209'){
    			// console.log(cur);
    			var yz = cur.queryLeftNewDTO.yz_num;
    			var yw = cur.queryLeftNewDTO.yw_num;
    			var trainNum = cur.queryLeftNewDTO.station_train_code;
    			console.log('硬座',yz);
    			console.log('硬卧',yw);
    			if(yz!='无'&&yz!='--'||yw!='无'&&yw!='--'){
    				if(yw_temp == yw && yz_temp == yz){
    					console.log('状态没改变，不重复发邮件');
    					return;
    				}
					var mailOptions = {
					    from: '15755191035@163.com', // 发件地址
					    to: '15755191035@163.com', // 收件列表
					    subject: trainNum+'有票啦，硬座：'+yz+'，硬卧：'+yw, // 标题
					    //text和html两者只支持一种
					    text: trainNum+'有票啦\n'+'时间是'+cur.queryLeftNewDTO.start_train_date+',\n出发时间:'+cur.queryLeftNewDTO.start_time+',\n到达时间:'+cur.queryLeftNewDTO.arrive_time+',\n历时：'+cur.queryLeftNewDTO.lishi+',\n始发站：'+cur.queryLeftNewDTO.from_station_name+',\n到达：'+cur.queryLeftNewDTO.to_station_name, // 标题
					    // html: '<b>Hello world ?</b>' // html 内容
					};

					// send mail with defined transport object
					transporter.sendMail(mailOptions, function(error, info){
					    if(error){
					        return console.log(error);
					    }
					    console.log('Message sent: ' + info.response);
					    yw_temp = yw;
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
		queryTickets();
        console.log('scheduleCronstyle:' + new Date());
}); 

