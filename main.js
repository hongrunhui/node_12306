const https = require('https');
const http = require('http');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const ca = fs.readFileSync('./cert/srca.cer.pem');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const scanf = require('scanf');
const program = require('commander');
const UA = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36";
const inquirer = require('inquirer');
let $;
var config = {};
var prompt = inquirer.createPromptModule();
let _stations = JSON.parse(fs.readFileSync('station.json', 'utf-8'));
let isRewrite = hasArgv(process.argv, '-r');
let isUpdateStation = hasArgv(process.argv, '-t');
function hasArgv(argv, filter) {
	argv = argv.slice(2);
	return argv.some((item, i) => {
		return filter === item;
	});
}
let startStations = {
	lists: [],
	origin: {}
};
let endStations = {
	lists: [],
	origin: {}
};
function searchTrain(answers, input) {
	input = input || '';
	console.log(input);
	return;
	if (Object.prototype.toString.call(_stations.stationInfo[input]) === '[object Array]') {

	}
	else {

	}
}
let questions = [
	{
		type: 'input',
		name: 'time',
		message: '输入日期-time(如:2017-01-27)：',
		validate(input) {
			let re = /[\d]{4}-[\d]{1,2}-[\d]{1,2}/ig;
			if (input.match(re)) {
				return true;
			}
			else {
				console.log(' (输入的日期非法，重新输入)');
				return false;
			}
		}
	},
	{
		type: 'input',
		name: 'from_station',
		message: '输入始发站拼音-from_station(如:shanghai)：',
		validate(input) {
			if (_stations.stationInfo[input]) {
				let temp = _stations.stationInfo[input];
				if (Object.prototype.toString.call(temp) === '[object Array]') {
					temp.forEach((item, i) => {
						startStations.lists.push(item.name);
						startStations.origin[item.name] = item;
					});
				}
				else {
					startStations.lists.push(temp.name);
					startStations.origin[temp.name] = temp;
				}
				return true;
			}
			else {
				console.log(' (没有这个车站哦，请重新输入)');
				return false;
			}
		}
	},
	{
		type: 'list',
		name: 'from_station_',
		message: '你选哪一个车站？',
		choices: startStations.lists,
		default: 0
	},
	{
		type: 'input',
		name: 'end_station',
		message: '输入终点站拼音-end_station(如:hefei)：',
		validate(input) {
			if (_stations.stationInfo[input]) {
				let temp = _stations.stationInfo[input];
				if (Object.prototype.toString.call(temp) === '[object Array]') {
					temp.forEach((item, i) => {
						endStations.lists.push(item.name);
						endStations.origin[item.name] = item;
					});
				}
				else {
					endStations.lists.push(temp.name);
					endStations.origin[temp.name] = temp;
				}
				return true;
			}
			else {
				console.log(' (没有这个车站哦，请重新输入)');
				return false;
			}
		}
	},
	{
		type: 'list',
		name: 'end_station_',
		message: '你选哪一个车站？',
		choices: endStations.lists,
		default: 0
	},
	{
		type: 'input',
		name: 'train_num',
		message: '输入车次-train_num(如:K1209，多个车次用|分开)：',
		validate(input) {
			return true;
		}
	},
	{
		type: 'input',
		name: 'your_mail',
		message: '输入邮箱-your_mail(如:123456789@163.com)：',
		validate(input) {
			return true;
		}
	},
	{
		type: 'password',
		name: 'mail_pass',
		message: '输入密码或者邮箱授权码-mail_pass：',
		validate(input) {
			return true;
		}
	},
	{
		type: 'confirm',
		name: 'ticket_type',
		message: '是否购买学生票?(y/n)：',
		validate(input) {
			return true;
		}
	},
	{
		type: 'input',
		name: 'receive_mail',
		message: '输入收件人邮箱(如果与上面的邮箱一致请直接回车)：',
		validate(input) {
			return true;
		}
	}
];
function getLeftTicketUrl(callback) {
	request.get("https://kyfw.12306.cn/otn/leftTicket/init", (e, r, b) => {
		const defaultUrl = 'leftTicket/queryZ';
		if (e) {
			callback && callback({leftTicketUrl: defaultUrl});
			console.log(e);
			return;
		}
		$ = cheerio.load(r.body, {decodeEntities: false});
		let pageHtml = $.html();
		let re = pageHtml.match(/var CLeftTicketUrl = '\w+\/\w+/ig);
		let leftTicketUrl;
		
		if (re && re.length) {
			leftTicketUrl = re[0].replace(/var CLeftTicketUrl = \'/, '');
			
			if (!leftTicketUrl) {
				leftTicketUrl = defaultUrl;
			}
		}
		else {
			leftTicketUrl = defaultUrl;			
		}
		callback && callback({leftTicketUrl: leftTicketUrl});
	});
}
if (isUpdateStation) {
	stationJson();
	return;
}
fs.readFile('config.json', 'utf-8', function (err, data) {
	if (err || !data || isRewrite) {
		prompt(questions).then(answer => {
			answer.from_station = startStations.origin[answer.from_station_]|| _stations.stationInfo[answer.from_station];	
			answer.end_station = endStations.origin[answer.end_station_] || _stations.stationInfo[answer.end_station];	
			answer.train_num = answer.train_num.split('|');
			answer.ticket_type = answer.ticket_type ? '0x00' : 'ADULT';
			answer.receive_mail = answer.receive_mail || answer.your_mail;
			config = answer;
			fs.writeFile('config.json', JSON.stringify(config));
			var rule = new schedule.RecurrenceRule();
			rule.second = [0];
			getLeftTicketUrl((data) => {
				config.leftTicketUrl = data.leftTicketUrl;
				queryTickets(config);
				schedule.scheduleJob(rule, function () {
					queryTickets(config);
				});
			});
		});
	}
	else {
		config = JSON.parse(data);
		var rule = new schedule.RecurrenceRule();
		rule.second = [0];
		getLeftTicketUrl((data) => {
			config.leftTicketUrl = data.leftTicketUrl;
			queryTickets(config);
			schedule.scheduleJob(rule, function () {
				queryTickets(config);
			});
		});
	}
	
});

var yz_temp = [], yw_temp = [];//保存余票状态
/*
* 查询余票
*/
function queryTickets(config) {
	/*设置请求头参数*/
	let leftTicketUrl = config.leftTicketUrl;
	console.log('当前请求的地址：', leftTicketUrl);
	var options = {
		hostname: 'kyfw.12306.cn',//12306
		port: 443,
		method: 'GET',
		path: '/otn/'+leftTicketUrl+'?leftTicketDTO.train_date=' + config.time + '&leftTicketDTO.from_station=' + config.from_station.code + '&leftTicketDTO.to_station=' + config.end_station.code + '&purpose_codes=' + config.ticket_type,
		ca: [ca],//证书
		rejectUnauthorized: false,
		headers: {
			"Accept": "*/*",
			'Connection': 'keep-alive',
			'Host': 'kyfw.12306.cn',
			'User-Agent': UA,
			"Connection": "keep-alive",
			"Referer": "https://kyfw.12306.cn/otn/leftTicket/init",
			"If-Modified-Since": "0",
			"X-Requested-With": "XMLHttpRequest",
			"Cookie": "JSESSIONID=B25D95DFEC49E5C65176B381555C38DA; _jc_save_wfdc_flag=dc; route=6f50b51faa11b987e576cdb301e545c4; BIGipServerotn=2766406154.38945.0000; acw_tc=AQAAADUPbiLlcgsAuLz+Z7yML4078ek+; BIGipServerpool_passport=334299658.50215.0000; RAIL_EXPIRATION=1516454884979; RAIL_DEVICEID=qZf4Jpki03x17e3hoZ1td3gIxLrh3ktcodtRqpODJdH0J-WB98EoFETG8NNJC-YXQIDd4wA6DD4CP5YhHvU6WrxKIiEDgvcTnhaj9ZvFkoAulVhEWzTXFP0O1VXy5nf24YuP23pxRskcdaaviMsDkCSMZgGwWQWC; _jc_save_toDate=2018-01-18; _jc_save_fromStation=%u5317%u4EAC%2CBJP; _jc_save_toStation=%u5408%u80A5%2CHFH; _jc_save_fromDate=2018-02-01",
			// "Cookie": "__NRF=D2A7CA0EBB8DD82350AAB934FA35745B; JSESSIONID=0A02F03F9852081DDBFEA4AA03EF4252C569EB7AB1; _jc_save_detail=true; _jc_save_showIns=true; BIGipServerotn=1072693770.38945.0000; _jc_save_fromStation=%u77F3%u5BB6%u5E84%2CSJP; _jc_save_toStation=%u5408%u80A5%2CHFH; _jc_save_fromDate=2017-02-17; _jc_save_toDate=2017-01-19; _jc_save_wfdc_flag=dc",
		}
	};
	function b4(ct, cv) {
		var cs = [];
		for (var cr = 0; cr < ct.length; cr++) {
			var cw = [];
			var cq = ct[cr].split("|");
			cw.secretHBStr = cq[36];
			cw.secretStr = cq[0];
			cw.buttonTextInfo = cq[1];
			var cu = [];
			cu.train_no = cq[2];
			cu.station_train_code = cq[3];
			cu.start_station_telecode = cq[4];
			cu.end_station_telecode = cq[5];
			cu.from_station_telecode = cq[6];
			cu.to_station_telecode = cq[7];
			cu.start_time = cq[8];
			cu.arrive_time = cq[9];
			cu.lishi = cq[10];
			cu.canWebBuy = cq[11];
			cu.yp_info = cq[12];
			cu.start_train_date = cq[13];
			cu.train_seat_feature = cq[14];
			cu.location_code = cq[15];
			cu.from_station_no = cq[16];
			cu.to_station_no = cq[17];
			cu.is_support_card = cq[18];
			cu.controlled_train_flag = cq[19];
			cu.gg_num = cq[20] ? cq[20] : "--";
			// 高级软卧
			cu.gr_num = cq[21] ? cq[21] : "--";
			// 其他
			cu.qt_num = cq[22] ? cq[22] : "--";
			// 软卧
			cu.rw_num = cq[23] ? cq[23] : "--";
			// 软座
			cu.rz_num = cq[24] ? cq[24] : "--";
			cu.tz_num = cq[25] ? cq[25] : "--";
			// 无座
			cu.wz_num = cq[26] ? cq[26] : "--";
			cu.yb_num = cq[27] ? cq[27] : "--";
			// 硬卧
			cu.yw_num = cq[28] ? cq[28] : "--";
			// 硬座
			cu.yz_num = cq[29] ? cq[29] : "--";
			// 二等座
			cu.ze_num = cq[30] ? cq[30] : "--";
			// 一等座
			cu.zy_num = cq[31] ? cq[31] : "--";
			// 商务座
			cu.swz_num = cq[32] ? cq[32] : "--";
			// 动卧
			cu.srrb_num = cq[33] ? cq[33] : "--";
			cu.yp_ex = cq[34];
			cu.seat_types = cq[35];
			cu.exchange_train_flag = cq[36];
			cu.from_station_name = cv[cq[6]];
			cu.to_station_name = cv[cq[7]];
			cw.queryLeftNewDTO = cu;
			cs.push(cw)
		}
		return cs
	}
	/*请求开始*/
	var req = https.get(options, function (res) {
		var data = '';
		/*设置邮箱信息*/
		var transporter = nodemailer.createTransport({
			host: "smtp.163.com",//邮箱的服务器地址，如果你要换其他类型邮箱（如QQ）的话，你要去找他们对应的服务器，
			secureConnection: true,
			port: 465,//端口，这些都是163给定的，自己到网上查163邮箱的服务器信息
			auth: {
				user: config.your_mail,//邮箱账号
				pass: config.mail_pass,//邮箱密码
			}
		});
		res.on('data', function (buff) {
			data += buff;//查询结果（JSON格式）
		});
		res.on('end', function () {
			var jsonData;
			var trainData;
			//用来保存返回的json数据
			var trainMap;
			try {
				var _data = JSON.parse(data).data;
				trainData = _data && _data.result;
				trainMap = _data && _data.map;
			} catch (e) {
				console.log('JSON数据出错,请检查输入配置是否正确', e);
				console.log('出错的数据：', data);
				return;
			}
			jsonData = b4(trainData, trainMap);
			if (!jsonData || jsonData.length == 0) {
				console.log('没有查询到余票信息');
				return;
			}
			/*获取车次与车辆代码的映射表*/
			var jsonMap = {};
			for (var i = 0; i < jsonData.length; i++) {
				var cur = jsonData[i];
				jsonMap[cur.queryLeftNewDTO.station_train_code] = cur.queryLeftNewDTO;

			}
			/*过滤不需要的车次*/
			var train_arr = config.train_num;
			for (var j = 0; j < train_arr.length; j++) {
				var cur_train = jsonMap[train_arr[j]];//当前车次
				if (!cur_train) {
					console.log('当天没有' + train_arr[j] + '这趟车次');
					continue;
				}
				var yz = cur_train.yz_num;//硬座数目
				var yw = cur_train.yw_num;//硬卧数目
				let trains = {
					'高级软卧':cur_train.gr_num,
					// 其他
					'其他': cur_train.qt_num,
					// 软卧
					'软卧': cur_train.rw_num,
					// 软座
					'软座': cur_train.rz_num,
					// 无座
					'无座': cur_train.wz_num,
					// 硬卧
					'硬卧': cur_train.yw_num,
					// 硬座
					'硬座': cur_train.yz_num,
					// 二等座
					'二等座': cur_train.ze_num,
					// 一等座
					'一等座': cur_train.zy_num,
					// 商务座
					'商务座': cur_train.swz_num,
					// 动卧
					'动卧': cur_train.srrb_num
				}
				console.log('====', trains);
				// // 高级软卧
				// var gr_num = cur_train.gr_num;
				// // 其他
				// var qt_num = cur_train.qt_num;
				// // 软卧
				// var rw_num = cur_train.rw_num;
				// // 软座
				// var rz_num = cur_train.rz_num;
				// // 无座
				// var wz_num = cur_train.wz_num;
				// // 硬卧
				// var yw_num = cur_train.yw_num;
				// // 硬座
				// var yz_num = cur_train.yz_num;
				// // 二等座
				// var ze_num = cur_train.ze_num;
				// // 一等座
				// var zy_num = cur_train.zy_num;
				// // 商务座
				// var swz_num = cur_train.swz_num;
				// // 动卧
				// var srrb_num = cur_train.srrb_num;
				var trainNum = cur_train.station_train_code;//车次
				console.log('\n ' + trainNum + ' 车次的硬座余票数:', yz, ', 硬卧余票数:', yw, '。当前时间：' + getTime());
				if (yz != '无' && yz != '--' || yw != '无' && yw != '--') {
					if (yw_temp[j] == yw && yz_temp[j] == yz) {//当余票状态发生改变的时候就不发送邮件
						console.log(' ' + trainNum + '车次状态没改变，不重复发邮件');
						continue;
					}
					var mailOptions = {
						from: config.your_mail, // 发件邮箱地址
						to: config.receive_mail || config.your_mail, // 收件邮箱地址，可以和发件邮箱一样
						subject: trainNum + '有票啦，硬座：' + yz + '，硬卧：' + yw, // 邮件标题
						text: trainNum + '有票啦\n' + cur_train.from_station_name + '=============>' + cur_train.to_station_name + '\n出发日期：' + config.time + ',\n出发时间：' + cur_train.start_time + ',\n到达时间：' + cur_train.arrive_time + ',\n历时：' + cur_train.lishi, // 邮件内容
					};

					// 发邮件部分
					(function (j, yz, yw) {
						transporter.sendMail(mailOptions, function (error, info) {
							if (error) {
								return console.log(error);
							}
							console.log(' 邮件已发送: ====================> ' + mailOptions.to);
							yw_temp[j] = yw;//保存当前列车的余票数量
							yz_temp[j] = yz;
						});
					})(j, yz, yw);
				} else {
					console.log(trainNum + '硬座/硬卧无票');
				}
			}
			// fs.writeFile('./train.json',data);
		});
	});

	req.on('error', function (err) {
		console.error(err.code);
	});
}

/*
* 爬取全国车站信息并生成JSON文件
*/
function stationJson() {
	let _opt = {
		hostname: 'kyfw.12306.cn',
		path: '/otn/resources/js/framework/station_name.js?station_version=1.9044',
		ca: [ca],
		rejectUnauthorized: false		
	};
	let _data = '';
	let _req = https.get(_opt, function (res) {
		res.on('data', function (buff) {
			_data += buff;
		});
		res.on('end', function () {
			console.log(_data + '\n如果前面的信息不是车站信息，那就说明没有抓取成功，可能需要升级一下station_version');			
			try {
				let re = /\|[\u4e00-\u9fa5]+\|[A-Z]{3}\|\w+\|\w+\|\w+@\w+/g;
				// console.log('data',_data.match(re));
				let stationMap = {};
				let stationArray = [];
				let temp = _data.match(re);
				[].forEach.call(temp, function (item, i) {
					// console.log(item,i);
					let t = item.split("|");
					let info = {
						name: t[1],
						code: t[2],
						pinyin: t[3],
						suoxie: t[4],
						other: t[5]
					};
					stationArray.push(t[3]);
					if (!stationMap[t[3]]) {
						stationMap[t[3]] = info;						
					}
					else {
						if (Object.prototype.toString.call(stationMap[t[3]]) === '[object Array]') {
							stationMap[t[3]] = [...stationMap[t[3]], info];
						}
						else {
							stationMap[t[3]] = [stationMap[t[3]], info];						
						}
					}
				});
				// console.log(stationMap["hefei"]);
				fs.writeFile('station.json', JSON.stringify({ stationName: stationArray, stationInfo: stationMap }));
				console.log('成功更新车站信息！');
			} catch (e) {
				console.log('更新车站信息失败：', e);
				return null;
			}
		});
	});
	_req.on('error', function (err) {
		console.error(err.code);
	});
}
function getTime() {
	let T = new Date();
	return T.getFullYear() + '-' + (parseInt(T.getMonth()) + 1) + '-' + T.getDate() + ' ' + T.getHours() + ":" + T.getMinutes() + ":" + T.getSeconds();
}


