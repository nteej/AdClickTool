angular.module('app').value('columnDefinition', {
  campaign: [{
    key: 'campaignName',
    name: 'Campaign'
  },
    {
      key: 'campaignId',
      name: 'Campaign ID'
    },
    {
      key: 'campaignUrl',
      name: 'Campaign URL'
    },
    {
      key: 'campaignCountry',
      name: 'Campaign country'
    },
    {
      key: 'impressions',
      name: 'Impressions'
    }],
  flow: [{
    key: 'flowName',
    name: 'Flow'
  },
    {
      key: 'flowId',
      name: 'Flow ID'
    }],
  lander: [{
    key: 'landerName',
    name: 'Lander'
  },
    {
      key: 'landerId',
      name: 'Lander ID'
    },
    {
      key: 'landerUrl',
      name: 'Lander URL'
    },
    {
      key: 'landerCountry',
      name: 'Lander country'
    },
    {
      key: 'numberOfOffers',
      name: 'Number of offers'
    }],
  offer: [{
    key: 'offerName',
    name: 'Offer'
  },
    {
      key: 'offerId',
      name: 'Offer ID'
    },
    {
      key: 'offerUrl',
      name: 'Offer URL'
    },
    {
      key: 'offerCountry',
      name: 'Offer country'
    },
    {
      key: 'payout',
      name: 'Payout'
    }],
  traffic: [{
    key: 'trafficName',
    name: 'Traffic source'
  },
    {
      key: 'trafficId',
      name: 'Traffic source ID'
    }],
  affiliate: [{
    key: 'affiliateName',
    name: 'Affiliate Network'
  },
    {
      key: 'affiliateId',
      name: 'Affiliate Network ID'
    }],
  common: [{
    key: 'visits',
    name: 'Visits'
  },
    {
      key: 'clicks',
      name: 'Clicks'
    },
    {
      key: 'conversions',
      name: 'Conversions'
    },
    {
      key: 'revenue',
      name: 'Revenue'
    },
    {
      key: 'cost',
      name: 'Cost'
    },
    {
      key: 'profit',
      name: 'Profit'
    },
    {
      key: 'cpv',
      name: 'CPV'
    },
    {
      key: 'ictr',
      name: 'ICTR'
    }]
});
angular.module('app').value('groupByOptions', [
  { value: "campaign", display: "Campaign", idKey: "campaignId", nameKey: "campaignName" },
  { value: "flow", display: "Flow", idKey: "flowId", nameKey: "flowName" },
  /*
  { value: "brand", display: "Brands", idKey: "brandId", nameKey: "brandName" },
  { value: "affiliate", display: "Affiliate networks", idKey: "affnwId", nameKey: "afnwName" },
  { value: "browserversion", display: "Browser versions", idKey: "bvId", nameKey: "bvName" },
  { value: "browser", display: "Browsers", idKey: "browserId", nameKey: "browserName" },
  { value: "city", display: "City", idKey: "cityId", nameKey: "cityName" },
  { value: "connectiontype", display: "Connection type", idKey: "ctId", nameKey: "ctName" },
  { value: "conversion", display: "Conversions", idKey: "conversionId", nameKey: "conversionName" },
  { value: "country", display: "Country", idKey: "countryId", nameKey: "countryName" },
  { value: "day", display: "Day", idKey: "dayId", nameKey: "dayName" },
  { value: "dayofweek", display: "Day of week", idKey: "dowId", nameKey: "dowName" },
  { value: "devicetype", display: "Device types", idKey: "dtId", nameKey: "dtName" },
  { value: "hourofday", display: "Hour of day", idKey: "hodId", nameKey: "hodName" },
  { value: "ip", display: "IP", idKey: "ipId", nameKey: "ipName" },
  { value: "isp", display: "ISP / Carrier", idKey: "ispId", nameKey: "ispName" },
  */
  { value: "lander", display: "Landers", idKey: "landerId", nameKey: "landerName" },
  /*
  { value: "language", display: "Language", idKey: "languageId", nameKey: "languageName" },
  { value: "mobilecarrier", display: "Mobile carrier", idKey: "mcId", nameKey: "mcName" },
  { value: "model", display: "Models", idKey: "modelId", nameKey: "modelName" },
  { value: "monty", display: "Month", idKey: "montyId", nameKey: "montyName" },
  { value: "os", display: "OS", idKey: "osId", nameKey: "osName" },
  { value: "osversion", display: "OS versions", idKey: "osversionId", nameKey: "osversionName" },
  */
  { value: "offer", display: "Offers", idKey: "offerId", nameKey: "offerName" },
  /*
  { value: "referrer", display: "Referrer", idKey: "referrerId", nameKey: "referrerName" },
  { value: "referrerdomain", display: "Referrer domain", idKey: "referrerdomainId", nameKey: "referrerdomainName" },
  { value: "region", display: "State / Region", idKey: "regionId", nameKey: "regionName" },
  */
  { value: "traffic", display: "Traffic Source", idKey: "trafficId", nameKey: "trafficName" },
  { value: "affiliate", display: "Affiliate Network", idKey: "affiliateId", nameKey: "affiliateName" }
]);

angular.module('app').value('userPreferences', {
  "reportViewLimit": 500,
  "entityType": 1,
  "reportViewSort": {
    "key": "visits",
    "direction": "desc"
  },
  "reportTimeZone": "+08:00",
  "reportViewColumns": {
    "offerName": {
      "visible": true
    },
    "offerId": {
      "visible": true
    },
    "offerUrl": {
      "visible": false
    },
    "offerCountry": {
      "visible": false
    },
    "payout": {
      "visible": true
    },
    "impressions": {
      "visible": true
    },
    "visits": {
      "visible": true
    },
    "clicks": {
      "visible": true
    },
    "conversions": {
      "visible": true
    },
    "revenue": {
      "visible": true
    },
    "cost": {
      "visible": true
    },
    "profit": {
      "visible": true
    },
    "cpv": {
      "visible": true
    },
    "ictr": {
      "visible": true
    },
    "ctr": {
      "visible": true
    },
    "cr": {
      "visible": true
    },
    "cv": {
      "visible": true
    },
    "roi": {
      "visible": true
    },
    "epv": {
      "visible": true
    },
    "epc": {
      "visible": true
    },
    "ap": {
      "visible": true
    },
    "affiliateName": {
      "visible": true
    },
    "campaignName": {
      "visible": true
    },
    "campaignId": {
      "visible": true
    },
    "campaignUrl": {
      "visible": false
    },
    "campaignCountry": {
      "visible": false
    },
    "pixelUrl": {
      "visible": false
    },
    "postbackUrl": {
      "visible": false
    },
    "trafficName": {
      "visible": true
    },
    "clickRedirectType": {
      "visible": false
    },
    "costModel": {
      "visible": false
    },
    "cpa": {
      "visible": true
    },
    "cpc": {
      "visible": true
    },
    "cpm": {
      "visible": true
    },
    "city": {
      "visible": true
    },
    "flowName": {
      "visible": true
    },
    "landerName": {
      "visible": true
    },
    "landerId": {
      "visible": false
    },
    "landerUrl": {
      "visible": false
    },
    "landerCountry": {
      "visible": false
    },
    "numberOfOffers": {
      "visible": false
    }
  }
});
