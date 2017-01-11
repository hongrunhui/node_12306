var https = require('https');
var fs = require('fs');
var ca = fs.readFileSync('./cert/srca.cer.pem');
var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var options = { 
    hostname: 'kyfw.12306.cn',
    path: '/otn/leftTicket/queryA?leftTicketDTO.train_date=2017-01-21&leftTicketDTO.from_station=SHH&leftTicketDTO.to_station=SRG&purpose_codes=ADULT',
    // rejectUnauthorized: false  // 忽略安全警告
    ca:[ca]
};


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
    			if(!isNaN(yz)){
    				console.log(yz);
					var mailOptions = {
					    from: '15755191035@163.com', // 发件地址
					    to: '1037647264@qq.com', // 收件列表
					    subject: 'K1209有硬座票啦，剩余'+yz+'张', // 标题
					    //text和html两者只支持一种
					    text: 'k1209有硬座票啦，剩余'+yz+'张', // 标题
					    // html: '<b>Hello world ?</b>' // html 内容
					};

					// send mail with defined transport object
					transporter.sendMail(mailOptions, function(error, info){
					    if(error){
					        return console.log(error);
					    }
					    console.log('Message sent: ' + info.response);

					});
    			}else{
    				console.log('硬座无票');
    			}
    			if(!isNaN(yw)){
    				console.log(yw);
    				yw = yw||'';
    				var mailOptions = {
					    from: '15755191035@163.com', // 发件地址
					    to: '1037647264@qq.com', // 收件列表
					    subject: 'k1209有硬卧票啦，剩余'+yw+'张', // 标题
					    //text和html两者只支持一种
					    text: 'k1209有硬卧票啦，剩余'+yw+'张', // 标题
					    // html: '<b>Hello world ?</b>' // html 内容
					};

					// send mail with defined transport object
					transporter.sendMail(mailOptions, function(error, info){
					    if(error){
					        return console.log(error);
					    }
					    console.log('Message sent: ' + info.response);

					});
    			}else{
    				console.log('硬卧无票');
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

