var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Joi = require('joi');
var common = require('./common');

var attrs = `UserID
CampaignID
CampaignName
FlowID
FlowName
LanderID
LanderName
OfferID
OfferName
OfferUrl
OfferCountry
AffiliateNetworkID
AffilliateNetworkName
TrafficSourceID
TrafficSourceName
Language
Model
Country
City
Region
ISP
MobileCarrier
Domain
DeviceType
Brand
OS
OSVersion
Browser
BrowserVersion
ConnectionType
Timestamp
Visits
Clicks
Conversions
Cost
Revenue
Impressions
KeysMD5
V1
V2
V3
V4
V5
V6
V7
V8
V9
V10`

attrs = attrs.split('\n')

var mapping = {
  UserID: "UserID",
  CampaignID: "CampaignID",
  CampaignName: "CampaignName",
  FlowID: "FlowID",
  FlowName: "FlowName",
  LanderID: "LanderID",
  LanderName: "LanderName",
  OfferID: "OfferID",
  OfferName: "OfferName",
  OfferUrl: "OfferUrl",
  OfferCountry: "OfferCountry",
  AffiliateNetworkID: "AffiliateNetworkID",
  AffilliateNetworkName: "AffilliateNetworkName",
  TrafficSourceID: "TrafficSourceID",
  TrafficSourceName: "TrafficSourceName",
  Language: "Language",
  Model: "Model",
  Country: "Country",
  City: "City",
  Region: "Region",
  ISP: "ISP",
  MobileCarrier: "MobileCarrier",
  Domain: "Domain",
  DeviceType: "DeviceType",
  Brand: "Brand",
  OS: "OS",
  OSVersion: "OSVersion",
  Browser: "Browser",
  BrowserVersion: "BrowserVersion",
  ConnectionType: "ConnectionType",
  Timestamp: "Timestamp",
  Visits: "Visits",
  Clicks: "Clicks",
  Conversions: "Conversions",
  Cost: "Cost",
  Revenue: "Revenue",
  Impressions: "Impressions",
  KeysMD5: "KeysMD5",
  V1: "V1",
  V2: "V2",
  V3: "V3",
  V4: "V4",
  V5: "V5",
  V6: "V6",
  V7: "V7",
  V8: "V8",
  V9: "V9",
  V10: "V10"
}



/**
 * @api {post} /api/report  报表
 * @apiName  报表
 * @apiGroup report
 * @apiDescription  报表
 *
 * @apiParam {String} from 开始时间
 * @apiParam {String} to   截止时间
 * @apiParam {String} tz   timezone
 * @apiParam {String} sort  排序字段
 * @apiParam {String} direction  desc
 * @apiParam {String} groupBy
 * @apiParam {String} type
 * @apiParam {Number} offset
 * @apiParam {Number} limit
 * @apiParam {String} include    数据状态 all  traffic active
 * @apiParam {String} [filter]
 * @apiParam {String} [filter1]
 * @apiParam {String} [filter1Value]
 * @apiParam {String} [filter2]
 * @apiParam {String} [filter2Value]
 * @apiParam {String} [filter3]
 * @apiParam {String} [filter3Value]
 * @apiParam {Number} active
 *
 *
 */


//from   to tz  sort  direction columns=[]  groupBy  offset   limit  filter1  filter1Value  filter2 filter2Value

router.post('/api/report', async function (req, res, next) {
    req.body.userId = req.userId;
    try {
        let result;
        let connection = await common.getConnection();
        result = await campaignReport(req.body, connection);
        connection.release();
        res.json({
            status: 1,
            message: 'success',
            data: result
        });
    } catch (e) {
        return next(e);
    }

});

async function campaignReport(value, connection) {
    let offset = (value.page - 1) * value.limit;
    let {
        groupBy,
        limit,
        page,
        from,
        to,
        tz} = value;

    let sqlWhere = {};

    _.forEach(attrs, (attr)=> {
      if (value[attr]) {
        sqlWhere[attr] = value[attr];
      }
    })

    let sql = buildSql()({
      sqlWhere,
      from,
      to,
      tz,
      groupBy
    });

    let countsql = "select COUNT(*) as `total` from ((" + sql + ") as T)";

    sql += " limit " + offset + "," + limit;

    let sumSql = "select sum(`Impressions`) as `impressions`, sum(`Visits`) as `visits`,sum(`Clicks`) as `clicks`,sum(`Conversions`) as `conversions`,sum(`Cost`) as `cost`,sum(`Profit`) as `profit`,sum(`Cpv`) as `cpv`,sum(`Ictr`) as `ictr`,sum(`Ctr`) as `ctr`,sum(`Cr`) as `cr`,sum(`Cv`) as `cv`,sum(`Roi`) as `roi`,sum(`Epv`) as `epv`,sum(`Epc`) as `epc`,sum(`Ap`) as `ap` from ((" +
        sql + ") as K)";

    console.log(sumSql);


    let result = await Promise.all([query(sql, connection), query(countsql, connection), query(sumSql, connection)]);

    return ({
        totalRows: result[1][0].total,
        totals: result[2][0],
        rows: result[0]
    });

}



function query(sql, connection) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result);
        })
    })
}






module.exports = router;




function buildSql() {
  let template = `
select ads.UserID,ads.Language,ads.Model,ads.Country,ads.City,ads.Region,ads.ISP,ads.MobileCarrier,ads.Domain,ads.DeviceType,ads.Brand,ads.OS,ads.OSVersion,ads.Browser,ads.BrowserVersion,ads.ConnectionType,ads.Timestamp,sum(ads.Visits) as Visits,sum(ads.Clicks) as
Clicks, sum(ads.Conversions) as Conversions, sum(ads.Cost)/1000000 as Cost, sum(ads.Revenue)/1000000 as Revenue,sum(ads.Impressions) as Impressions,ads.KeysMD5,ads.V1,ads.V2,ads.V3,ads.V4,ads.V5,ads.V6,ads.V7,ads.V8,ads.V9,ads.V10,
c.id as CampaignId, c.name as CampaignName, c.url as CampaignUrl, c.country as CampaignCountry,
f.id as FlowId, f.name as FlowName,
l.id as LanderId, l.name as LanderName, l.url as LanderUrl, l.country as LanderCountry,
o.id as OfferId, o.name as OfferName, o.url as OfferUrl, o.country as OfferCountry,
t.id as TrafficSourceId, t.name as TrafficSourceName,
a.id as AffiliateNetworkId, a.name as AffiliateNetworkName,
sum(ads.\`Revenue\`/1000000)-sum(ads.\`Cost\`/1000000) as \`profit\`,
sum(ads.\`Cost\`/1000000)/sum(ads.\`Impressions\`) as \`cpv\`,
sum(ads.\`Visits\`)/sum(ads.\`Impressions\`) as \`ictr\`,
sum(ads.\`Clicks\`)/sum(ads.\`Visits\`) as \`ctr\`,
sum(ads.\`Conversions\`)/sum(ads.\`Clicks\`) as \`cr\`,
sum(ads.\`Conversions\`)/sum(ads.\`Visits\`) as \`cv\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Cost\`/1000000) as \`roi\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Visits\`) as \`epv\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Clicks\`) as \`epc\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Conversions\`) as \`ap\`
from AdStatis ads
inner join TrackingCampaign c on c.id = ads.CampaignId
inner join Flow f on f.id = ads.FlowId
inner join Lander l on l.id = ads.LanderId
inner join Offer o on o.id = ads.OfferId
inner join TrafficSource t on t.id = ads.TrafficSourceId
inner join AffiliateNetwork a on a.id = ads.AffiliateNetworkId
where
1=1
and ads.\`Timestamp\` >= UNIX_TIMESTAMP(CONVERT_TZ('<%= from %>', '+00:00','<%= tz %>'))
<% _.forEach(Object.keys(sqlWhere), function(key){ %>
and ads.\`<%- key %>\`=<%= sqlWhere[key]%>
<% }) %>
and ads.\`Timestamp\` <= UNIX_TIMESTAMP(CONVERT_TZ('<%= to %>', '+00:00','<%= tz %>'))
group by \`<%= groupBy %>\`
order by CampaignId `

  return _.template(template);
}
