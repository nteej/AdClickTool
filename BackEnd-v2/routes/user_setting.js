var express = require('express');
var router = express.Router();
var Joi = require('joi');
var common = require('./common');
var md5 = require('md5');
var _ = require('lodash');
var dns = require("dns");
var setting = require('../config/setting');
var _ = require('lodash');
var emailCtrl = require('../util/email');
var uuidV4 = require('uuid/v4');


/**
 * @api {get} /api/profile
 * @apiName
 * @apiGroup User
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success',
 *    data:{
 *        idText:"",
          firstname: 'test',
          lastname:'test',
          companyname: 'zheng',
          tel: '13120663670',
          email:"",
          timezone:'+08:00',
          homescreen:'dashboard',  // or campaignList
          referralToken:"",
          status:0  //0:New;1:运行中;2:已过期
    }
 *
 *   }
 *
 */
router.get('/api/profile', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required()
    });
    req.query.userId = req.subId;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let result = await query("select `idText`,`firstname`,`lastname`,`email`,`status`,`timezone`,`setting`,`referralToken` from User where  `id`= ?", [value.userId], connection);

        let responseData = {};
        if (result.length) {
            responseData.idText = result[0].idText;
            responseData.firstname = result[0].firstname;
            responseData.lastname = result[0].lastname;
            responseData.status = result[0].status;
            responseData.timezone = result[0].timezone;
            responseData.referralToken = result[0].referralToken;
            responseData.email = result[0].email;
            if (result[0].setting) {
                let settingJSON = JSON.parse(result[0].setting);
                responseData.companyname = settingJSON.companyname ? settingJSON.companyname : "";
                responseData.tel = settingJSON.tel ? settingJSON.tel : "";
                responseData.homescreen = settingJSON.homescreen ? settingJSON.homescreen : "";
            } else {
                responseData.companyname = "";
                responseData.tel = "";
                responseData.homescreen = "dashboard";
            }
        }
        res.json({
            status: 1,
            message: 'succes',
            data: responseData
        });
    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }

});

/**
 * @api {post} /api/profile
 * @apiName
 * @apiGroup User
 *
 * @apiParam {String} firstname
 * @apiParam {String} lastname
 * @apiParam {String} [companyname]
 * @apiParam {String} [tel]
 * @apiParam {String} timezone
 * @apiParam {String} homescreen
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success',
 *    data:{
          firstname: 'test',
          lastname:'test',
          companyname: 'zheng',
          tel: "13120663670",
          timezone:'+08:00',
          homescreen:'dashboard',  // or campaignList
     }
 *
 *  }
 *
 */
router.post('/api/profile', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        companyname: Joi.string().optional().allow(""),
        tel: Joi.string().optional().empty(""),
        timezone: Joi.string().required(),
        homescreen: Joi.string().required()
    });
    req.body.userId = req.subId;
    let connection;
    try {
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        let valueCopy = {};
        Object.assign(valueCopy, value);
        let sql = 'update User set ';
        if (valueCopy.firstname) {
            sql += "`firstname`='" + valueCopy.firstname + "'";
        }
        if (valueCopy.lastname) {
            sql += ",`lastname`='" + valueCopy.lastname + "'";
        }
        if (valueCopy.timezone) {
            sql += ",`timezone`='" + valueCopy.timezone + "'";
        }
        if (valueCopy.companyname != undefined) {
            sql += ",`campanyName`='" + valueCopy.companyname + "'";
        }

        delete valueCopy.userId;

        sql += ",`setting`='" + JSON.stringify(valueCopy) + "'";

        sql += " where `id`= ? ";
        await query(sql, [value.userId], connection);

        res.json({
            "status": 1,
            "message": "success",
            "data": valueCopy
        });
    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }

    }

});


/**
 * @api {post} /api/password   用户修改密码
 * @apiName  用户修改密码
 * @apiGroup User
 *
 * @apiParam {String} oldpassword
 * @apiParam {String} newpassword
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 1,
 *       "message": "success"
 *     }
 *
 * @apiErrorExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 0,
 *       "message": "old password error"
 *     }
 *
 */
router.post('/api/password', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        oldpassword: Joi.string().required().trim(),
        newpassword: Joi.string().required().trim()
    });
    req.body.userId = req.subId;
    let connection;

    try {
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        let result = await query("select `password`,`idText` from User where `id`= ? ", [value.userId], connection);
        if (result.length) {
            if (md5(value.oldpassword + result[0].idText) == result[0].password) {
                await query("update User set `password`= ? where `id`= ? ", [md5(value.newpassword + result[0].idText), value.userId], connection);
                return res.json({
                    status: 1,
                    message: 'success'
                });
            } else {
                let err = new Error("password error");
                err.status = 200;
                throw err;

            }
        } else {
            let err = new Error("account error");
            err.status = 200;
            throw err;
        }

    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }

});


/**
 * @api {post} /api/email   用户修改邮箱
 * @apiName   用户修改邮箱
 * @apiGroup User
 *
 * @apiParam {String} password
 * @apiParam {String} email
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 1,
 *       "message": "success"
 *     }
 *
 * @apiErrorExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 0,
 *       "message": "password error" // email exists
 *     }
 *
 */
router.post('/api/email', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    req.body.userId = req.subId;
    let connection;
    try {
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        //check email 是否存在
        let UserResult = await query("select id from User where `email`= ? ", [value.email], connection);
        if (UserResult.length > 0) {
            let err = new Error("email exists");
            err.status = 200;
            throw err;
        }

        let result = await query("select `password`,`idText` from User where `id`= ? ", [value.userId], connection);


        if (result && result[0]) {
            if (md5(value.password + result[0].idText) == result[0].password) {
                await query("update User set `email`= ?  where `id`= ? ", [value.email, value.userId], connection);
                return res.json({
                    status: 1,
                    message: "success"
                });
            } else {
                let err = new Error("password error");
                err.status = 200;
                throw err;
            }
        } else {
            let err = new Error("account error");
            err.status = 200;
            throw err;
        }

    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }

    }

});


/**
 * @api {get} /api/referrals   用户推广收益
 * @apiName  用户推广收益
 * @apiGroup User
 *
 * @apiParam {Number} page
 * @apiParam {Number} limit
 * @apiParam {String} order  "-name"
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 1,
 *       "message": "success",
 *       "data":{
 *           referrals:[
 *           {"referredUserId":,
 *           "acquired":"17-02-2017 00:00",
 *            "status":"New",
 *            "lastactivity":"17-02-2017 00:00",
 *            "recentCommission":"",
 *            "totalCommission":""}],
 *          "totals":{count:2,"lastMonthCommissions":"","lifeTimeCommissions":""}]
 *        }
 *     }
 *
 */
router.get('/api/referrals', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        page: Joi.number().required().min(1),
        limit: Joi.number().required().min(1),
        order: Joi.string().required()
    });
    req.query.userId = req.subId;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let {
            limit,
            page,
            order,
            userId
        } = value;
        let dir = "asc";
        limit = parseInt(limit);
        page = parseInt(page);
        let offset = (page - 1) * limit;
        if (order.indexOf('-') >= 0) {
            dir = "desc";
            order = order.replace(new RegExp(/-/g), '');
        }
        let listSql = "select  user.`idText` as referredUserId ,FROM_UNIXTIME(log.`acquired`,'%d-%m-%Y %H:%i') as acquired," +
            "(case log.`status` when 0 then \"New\" when 1 then \"Activated\"  END) as status," +
            "FROM_UNIXTIME(log.`lastActivity`,'%d-%m-%Y %H:%i') as lastactivity," +
            "log.`recentCommission` as recentCommission,log.`totalCommission` as totalCommission " +
            "from UserReferralLog log  inner join User  user on user.`id` = log.`referredUserId` where log.`userId`=" + userId;

        let countsql = "select COUNT(*) as `count`,sum(recentCommission) as lastMonthCommissions,sum(totalCommission) as lifeTimeCommissions from ((" + listSql + ") as T)";

        listSql += " order by " + order + " " + dir + " limit " + offset + "," + limit;

        let result = await Promise.all([query(listSql, [], connection), query(countsql, [], connection)]);
        res.json({
            status: 1,
            message: 'succes',
            data: {
                referrals: result[0],
                totals: result[1].length ? result[1][0] : { count: 0, lastMonthCommissions: 0, lifeTimeCommissions: 0 }
            }
        });
    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }

});

/**
 * @api {get} /api/domains 获取用户domdomains
 * @apiName 获取用户domdomains
 * @apiGroup User
 *   @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
       // {
       //     status: 1,
       //     message: 'success',
       //     data: {
       //         internal: [
       //             {
       //                 address: "www.newbidder1.com",
       //                 main: false
       //             },
       //             {
       //                 address: "www.newbidder2.com",
       //                 main: true
       //             },
       //             {
       //                 address: "www.newbidder1.com",
       //                 main: false
       //             }
       //         ],
       //         custom: [
       //             {
       //                 address: "www.adbund.com",
       //                 main: false
       //             }
       //         ]
       //     }
       // }
 *
 */
router.get('/api/domains', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required()
    });
    req.query.userId = req.userId;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let result = {
            internal: [],
            custom: []
        }
        let sql = "select `domain` as address,`main`,`customize` from UserDomain where `userId`= ? and `deleted`=0 ";
        let userDomians = await common.query(sql, [value.userId], connection);
        for (let index = 0; index < userDomians.length; index++) {
            if (userDomians[index].customize == 0) {
                result.internal.push({ address: userDomians[index].address, main: userDomians[index].main == 1 ? true : false });
            } else {
                result.custom.push({ address: userDomians[index].address, main: userDomians[index].main == 1 ? true : false });
            }
        }
        res.json({
            status: 1,
            message: 'succes',
            data: result
        });
    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }

});


/**
 * @api {post} /api/domains 用户修改domdomains
 * @apiName 用户修改domdomains
 * @apiGroup User
 * apiParam {Array} internal
 * apiParam {Array} custom
   {
       //         internal: [
       //             {
       //                 address: "www.newbidder1.com",
       //                 main: false
       //             },
       //             {
       //                 address: "www.newbidder2.com",
       //                 main: true
       //             },
       //             {
       //                 address: "www.newbidder1.com",
       //                 main: false
       //             }
       //         ],
       //         custom: [
       //             {
       //                 address: "www.adbund.com",
       //                 main: false
       //             }
       //         ]
       //     }

 *
 */
router.post('/api/domains', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        internal: Joi.array().items({
            address: Joi.string().required(),
            main: Joi.boolean().required()
        }).required().length(3),
        custom: Joi.array().items({
            address: Joi.string().required(),
            main: Joi.boolean().required()
        }).required()
    });
    req.body.userId = req.subId;
    let connection;
    try {
        let insertData = [];
        let value = await common.validate(req.body, schema);
        //check params
        let passCheck = false;
        let mainDomianNumber = 0;
        for (let index = 0; index < value.internal.length; index++) {
            if (value.internal[index].main) {
                mainDomianNumber++;
            }
            insertData.push({ domain: value.internal[index].address, main: value.internal[index].main ? 1 : 0, customize: 0 });

        }
        for (let index = 0; index < value.custom.length; index++) {
            if (value.custom[index].main) {
                mainDomianNumber++;
            }
            insertData.push({ domain: value.custom[index].address, main: value.custom[index].main ? 1 : 0, customize: 1 });
        }
        if (mainDomianNumber !== 1) {
            throw new Error("please reset mian domian correctly");
        }

        connection = await common.getConnection();
        await common.query("update UserDomain set `deleted` = 1 where `userId`= ? ", [value.userId], connection);

        for (let index = 0; index < insertData.length; index++) {
            let sql = "insert into UserDomain (`domain`,`main`,`customize`,`userId`) values (?,?,?,?)";
            await common.query(sql, [insertData[index].domain, insertData[index].main, insertData[index].customize, value.userId], connection);
        }
        delete value.userId;
        res.json({
            status: 1,
            message: 'succes',
            data: value
        });
    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }

});





/**
 * @api /api/domains/validatecname
 * @apiName 验证Domain Adress
 * @apiGroup User
 *
 * @apiParam {String} adress {adress: 'www.adbund.com'}
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
         {
            status: 1,
            message: 'success',
            data: {
                domain: 'www.adbund.com',
                validateResult: "NOT_FOUND"
            }
        }
 */
router.get('/api/domains/validatecname', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required(),
        address: Joi.string().required()
    });
    req.query.userId = req.subId;
    req.query.idText = req.subidText;
    try {
        let cnames = [];
        let value = await common.validate(req.query, schema);
        cnames = await ((address) => {
            return new Promise(function (resolve, reject) {
                dns.resolveCname(address, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);

                });
            });
        })(value.address);

        //获取该用户系统默认domians
        let userDefaultDomains = [];
        for (let index = 0; index < setting.domains.length; index++) {
            userDefaultDomains.push(value.idText + "." + setting.domains[index].address);
        }

        let checked = false;

        for (let index = 0; index < cnames.length; index++) {
            if (_.includes(userDefaultDomains, cnames[index])) {
                checked = true;
            }
        }

        let validateResult = "NOT_FOUND";

        if (checked) {
            validateResult = "Matched"
            res.json({
                status: 1,
                message: "success",
                data: {
                    domain: value.address,
                    validateResult: validateResult
                }
            });
            return;
        }

        res.json({
            status: 0,
            message: validateResult,
            data: {
                domain: value.address,
                validateResult: validateResult
            }
        });
    } catch (e) {
        next(e);
    }

});



/**
 * @api {post} /api/blacklist   新增黑名单策略
 *
 * @apiGroup User
 * @apiName 新增黑名单策略
 *
 * @apiParam blacklist
 * @apapiParam enabled
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * {
    "status": 1,
    "message": "success",
    "data": {

        "blacklist": [
            {
                "id": 1,
                "name": "test1",
                "ipRules": [
                    {
                        "ipRangeStart": "1.1.1.1",
                        "ipRangeEnd": "1.1.1.1"
                    }
                ],
                "userAgentRules": [
                    {
                        "userAgent": "test1"
                    }
                ]
            },
            {
                "id": 2,
                "name": "test2",
                "ipRules": [
                    {
                        "ipRangeStart": "1.1.1.1",
                        "ipRangeEnd": "1.1.1.1"
                    }
                ],
                "userAgentRules": [
                    {
                        "userAgent": "test2"
                    }
                ]
            }
        ]
    }
}
 */

router.post('/api/blacklist', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required(),
        enabled: Joi.boolean().required(),
        blacklist: Joi.array().required().items({
            name: Joi.string().required(),
            ipRules: Joi.array().required(),
            userAgentRules: Joi.array().required()
        })
    });
    req.body.userId = req.subId;
    req.body.idText = req.subidText;
    let connection;
    try {
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        await common.query("delete from UserBotBlacklist  where `userId`= ? ", [value.userId], connection);
        for (let index = 0; index < value.blacklist.length; index++) {
            await common.query("insert into UserBotBlacklist (`userId`,`name`,`ipRange`,`userAgent`,`enabled`) values (?,?,?,?,?)", [value.userId, value.blacklist[index].name, JSON.stringify(value.blacklist[index].ipRules), JSON.stringify(value.blacklist[index].userAgentRules), value.enabled ? 1 : 0], connection);
        }

        delete value.userId;
        delete value.idText;

        res.json({
            status: 1,
            message: 'success',
            data: value
        });

    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }

});


router.get('/api/blacklist', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required()
    });
    req.body.userId = req.userId;
    req.body.idText = req.idText;
    let connection;
    try {
        let responseData = {
            enabled: false,
            blacklist: []
        };
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        let result = await common.query("select  `name`,`ipRange`,`userAgent`,`enabled` from UserBotBlacklist  where `userId`= ? and `deleted` = ? ", [value.userId, 0], connection);
        for (let index = 0; index < result.length; index++) {
            responseData.blacklist.push({
                name: result[index].name,
                ipRules: JSON.parse(result[index].ipRange),
                userAgentRules: JSON.parse(result[index].userAgent)
            });
            responseData.enabled = result[index].enabled == 1 ? true : false;
        }
        res.json({
            status: 1,
            message: 'success',
            data: responseData
        });

    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }

});


/**
 * @api {post} /api/invitation   邀请user
 *
 * @apiGroup User
 * @apiName 邀请user
 *
 * @apiParam  {Array} invitationEmail
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
  "status": 1,
  "message": "success",
  "data": {
    "invitations": [
      {
        "id": 8,
        "email": "keepin.aedan@gmail.com",
        "lastDate": "22-02-2017",
        "status": 0
      },
      {
        "id": 10,
        "email": "772063721@qq.com",
        "lastDate": "22-02-2017",
        "status": 0
      }
    ]
  }
}
 *
 *
 **/
router.post('/api/invitation', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required(),
        invitationEmail: Joi.array().items(Joi.string().email()).required().min(1),
        groupId: Joi.string().required()
    });
    let connection;
    let beginTransaction = false;
    try {
        req.body.userId = req.subId;
        req.body.idText = req.subidText;
        req.body.groupId = req.subgroupId;
        let sendContext = [];
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        await common.beginTransaction(connection);
        beginTransaction = true;
        //邀请入库
        for (let index = 0; index < value.invitationEmail.length; index++) {
            let invatationSlice = await common.query("select `id`,`groupId`,`inviteeEmail`,`status`,`code` from GroupInvitation where `deleted`= 0 and `groupId`=? and `inviteeEmail`=? ", [value.groupId, value.invitationEmail[index]], connection);
            //存在未接受邀请的重新发送
            if (invatationSlice.length) {
                if (invatationSlice[0].status != 1) {
                    await common.query("update GroupInvitation set `status`= 0 ,`inviteeTime`= unix_timestamp(now()) where `id`= ? ", [invatationSlice[0].id], connection);
                    sendContext.push({ email: value.invitationEmail[index], code: invatationSlice[0].code })
                }
            } else {//新邀请
                let code = uuidV4();
                await common.query("insert into GroupInvitation (`userId`,`groupId`,`inviteeEmail`,`inviteeTime`,`code`) values(?,?,?,unix_timestamp(now()),?)", [value.userId, value.groupId, value.invitationEmail[index], code], connection);
                sendContext.push({ email: value.invitationEmail[index], code: code })
            }
        }


        let tpl = {
            subject: 'Newbidder Invitation', // Subject line
            text: ``, // plain text body
            html: ""
        }
        let htmlTpl = _.template(`<p>Hello,<p>

                <p><%=name%> invited you to join <%=companyname%> on Newbidder.</p>

                <p>Please <a href="<%= href%>">click here</a> to accept the invitation.</p>

                <p>Best regards,</p>

                <p> Newbidder Team </p>`); // html body

        //异步发送邀请邮件
        for (let i = 0; i < sendContext.length; i++) {
            (function (context) {
                tpl.html = htmlTpl(({
                    name: req.firstname,
                    companyname: req.campanyname ? req.campanyname : req.firstname,
                    href: setting.invitationRouter + "?code=" + context.code
                }));
                emailCtrl.sendMail([context.email], tpl);
            })(sendContext[i])
        }

        let results = await common.query('select `id` ,`inviteeEmail` as email,FROM_UNIXTIME( `inviteeTime`, \"%d-%m-%Y\") as lastDate,`status` from GroupInvitation where (`status`= 0 or `status`= 1) and  `deleted`= 0 and `groupId`=? and `userId`= ? ', [value.groupId, value.userId], connection)
        if (beginTransaction) {
            await common.commit(connection);
        }
        res.json({
            status: 1,
            message: 'success',
            data: {
                invitations: results
            }
        });
    } catch (e) {
        next(e);
        if (beginTransaction) {
            await common.rollback(connection);
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }

});

/**
 * @api {get} /api/invitation   获取用户邀请lists
 *
 * @apiGroup User
 * @apiName 获取用户邀请lists
 *

 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *
 * {
  "status": 1,
  "message": "success",
  "data": {
    "invitations": [
      {
        "id": 8,
        "email": "keepin.aedan@gmail.com",
        "lastDate": "22-02-2017",
        "status": 0
      },
      {
        "id": 10,
        "email": "772063721@qq.com",
        "lastDate": "22-02-2017",
        "status": 0
      }
    ]
  }
}
 */
router.get('/api/invitation', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required(),
        groupId: Joi.string().required()
    });
    let connection;

    try {
        req.query.userId = req.subId;
        req.query.idText = req.subidText;
        req.query.groupId = req.subgroupId;

        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let result = await common.query('select `id` ,`inviteeEmail` as email,FROM_UNIXTIME( `inviteeTime`, \"%d-%m-%Y\") as lastDate,`status` from GroupInvitation where (`status`= 0 or `status`= 1) and  `deleted`= 0 and `groupId`=? and `userId`= ? ', [value.groupId, value.userId], connection)
        return res.json({
            status: 1,
            message: 'success',
            data: {
                invitations: result.length ? result : []
            }
        });
    } catch (e) {
        next(e);

    } finally {
        if (connection) {
            connection.release();
        }
    }
})




/**
 * @api {post} /api/invitation/:id  解除邀请
 *
 * @apiGroup User
 * @apiName 解除邀请
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * {status:1,message:'success'}
 *
 **/
router.delete('/api/invitation/:id', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required(),
        id: Joi.number().required()
    });
    let connection;

    try {
        req.query.userId = req.subId;
        req.query.idText = req.subidText;
        req.query.id = req.params.id;
        let value = await common.validate(req.query, schema);
        await common.query('update GroupInvitation set `status` = ? where `id`=? and `userId`= ?', [3, value.id, value.userId], connection);

        return res.json({
            status: 1,
            message: 'success'
        });
    } catch (e) {
        next(e);

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

/**
 * @api {get} /api/groups  获取用户所在的用户组
 *
 * @apiGroup User
 * @apiName  获取用户所在的用户组
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * {status:1,message:'success',data:{
 *
 *  groups:[{ groupId:"",
            firstname:"",
            lastname:"",
            email:""}]
 * }}
 *
 **/
router.get('/api/groups', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        idText: Joi.string().required()
    });
    let connection;
    try {
        req.query.userId = req.subId;
        req.query.idText = req.subidText;
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let result = [];
        //获取用户所在的用户组的管理员信息
        result = await common.query("select g1.`groupId`,user.`firstname`,user.`lastname`,user.`email` from UserGroup g1 inner join User user on user.`id`= g1.`userId` where `role` =0  and `groupId` in ( select `groupId` from  UserGroup g   where g.`userId`=?  and g.`role`= 1 and g.`deleted`=0)", [value.userId], connection);
        //myself
        result.push({
            groupId: req.subgroupId,
            firstname: req.firstname,
            lastname: req.lastname,
            email: req.email
        });

        return res.json({
            status: 1,
            message: 'success',
            data: {
                groups: result
            }
        });
    } catch (e) {
        next(e);

    } finally {
        if (connection) {
            connection.release();
        }
    }
});



/**
 * @api {get} /api/setup   获取setting  setup
 * @apiName   获取setting  setup
 * @apiGroup User
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 1,
 *       "message": "success"
 *       "data":{
 *           clickUrl:XXX,
 *           mutiClickUrl:xxx,
 *           postBackUrl:xxxx
 *        }
 *     }
 *
 */

router.get('/api/setup', function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.string().required()
    });
    req.query.userId = req.idText;
    Joi.validate(req.query, schema, function (err, value) {
        if (err) {
            return next(err);
        }
        try {
            let defaultDomain;
            for (let index = 0; index < setting.domains.length; index++) {
                if (setting.domains[index].postBackDomain) {
                    defaultDomain = setting.domains[index].address;
                }
            }
            return res.json({
                status: 1,
                message: 'success',
                data: {
                    clickUrl: setting.newbidder.httpPix + value.userId + "." + defaultDomain + setting.newbidder.clickRouter,
                    mutiClickUrl: setting.newbidder.httpPix + value.userId + "." + defaultDomain + setting.newbidder.mutiClickRouter,
                    postBackUrl: setting.newbidder.httpPix + value.userId + "." + defaultDomain + setting.newbidder.postBackRouter + setting.newbidder.postBackRouterParam
                }
            });
        } catch (e) {
            next(e);
        }
    });
});

/**
 * @api {get} /api/plan   用户当前套餐 
 * @apiName  用户当前套餐 
 * @apiGroup User
 * 
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
   {status:1,message:'success', "plan" : {
                    "id" : 1,
                    "name" : "Agency",
                    "price" : 399,                      //normalPrice  
                    "eventsLimit" : 10000000,
                    "overageCPM" : 0.000036,
                    "retentionLimit" : 370,
                    "userLimit" : 2,
                    "domainLimit" : 5                 
                }}
 *
 */
router.get('/api/plan', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required()
    });
    req.query.userId = req.subId;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let compled = _.template(`select   
        plan.\`id\` as id , plan.\`name\` as name, plan.\`normalPrice\` as price,plan.\`eventsLimit\` as eventsLimit,plan.\`retentionLimit\` as  retentionLimit,
        plan.\`userLimit\` as   userLimit,plan.\`domainLimit\` as domainLimit,(plan.\`overageCPM\`/ 1000000) as overageCPM  from UserBilling bill  inner join TemplatePlan plan on bill.\`planId\`= plan.\`id\` where bill.\`expired\` = 0 and bill.\`userId\`=<%=userId%>`);
        let sql = compled({
            userId: value.userId
        });
        let results = await query(sql, [], connection);
        let val = results.length ? results[0] : null;
        let responseData = { plan: {} };
        if (val) {
            responseData.plan = {
                id: val.id,
                name: val.name,
                price: val.price,
                eventsLimit: val.eventsLimit,
                overageCPM: val.overageCPM,
                retentionLimit: val.retentionLimit,
                userLimit: val.userLimit,
                domainLimit: val.domainLimit

            }
        }
        res.json({
            status: 1,
            message: 'succes',
            data: responseData
        });
    } catch (e) {
        next(e);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
})


function query(sql, params, connection) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, params, function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result);
        })
    })
}


module.exports = router;
