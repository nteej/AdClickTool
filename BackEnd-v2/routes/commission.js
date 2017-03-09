const common = require('./common');
const moment = require('moment');
var log4js = require('log4js');
var log = log4js.getLogger('commission');
import { logToUserFunctions } from './user_functions';

export default logTocommission;

async function logTocommission(paymentLogId) {
    let connect;
    try {
        connect = await common.getConnection();
        let refResult = await common.query("select ref.`id`,ref.`percent`,ref.`acquired`,pay.`amount` from UserPaymentLog pay  inner join UserReferralLog ref on pay.`userId`= ref.`referredUserId` where pay.`id`= ?", [paymentLogId], connect);
        if (refResult.length) {
            //注册1年之内
            if (moment.unix(refResult[0].acquired).add(1, 'y') > moment()) {
                await common.query("insert into UserCommissionLog (`referralId`,`paymentLogId`,`commission`,`createdAt`) values (?,?,?,?)", [refResult[0].id, paymentLogId, parseInt(refResult[0].amount * refResult[0].percent), parseInt(moment.utc().valueOf() / 1000)], connect);
            }
        } else {
            throw new Error("paymentLogId error")
        }
    } catch (e) {
        log.error("[commission.js][logTocommission][error]:", JSON.stringify(e));
        throw e;
    } finally {
        if (connect) {
            connect.release();
        }
    }
    return true;
}


//支付完成以后调用的后续流程
//1.logTocommission 查看该笔支付所属用户是否是通过推广进来的，要给推广用户佣金
//2.logToUserFunctions 更新该用户系统参数(不仅限于userLimit,domainLimit等 )
async function paymentFollowupWork(paymentLogId) {
    try {
        await Promise.all([logTocommission(paymentLogId), logToUserFunctions(paymentLogId)]);
    } catch (e) {
        log.error("[commission.js][paymentFollowupWork][error]:", JSON.stringify(e));
        throw e;
    }
    return true;
}