import express from 'express';
const router = express.Router();
import sequelize from 'sequelize';

export default router;

const {
  Provider,
  Statistic,
  ApiToken,
  Campaign
} = models;

router.get('/api/tsreference', async (req, res, next) => {
  let {id: userId} = req.user;
  try {
    let apiTokens = await ApiToken.findAll({
      where: {userId},
      include: [
        {
          model: Provider,
          required: true,
        }
      ]
    })

    let result = apiTokens.map((apiToken) => {
      return {
        id: apiToken.id,
        name: apiToken.name,
        token: apiToken.token,
        tsId: apiToken.provider_id
      }
    })
    res.json({
      status: 1,
      message: 'success',
      data: {
        tsreferences: result
      }
    })
  } catch (e) {
    next(e)
  }
})

async function upsert(req, res, next) {
  try {
    let {id: userId} = req.user;
    let {id, token, tsId, name} = req.body;
    let provider = await Provider.findById(tsId);
    if (!provider) throw new Error('provider not found');

    if (!id) id = 0;

    let apiToken = await ApiToken.findById(id)

    if (apiToken) {
      if (apiToken.token === token && apiToken.provider_id !== parseInt(tsId)) {
        apiToken.name = name;
        await apiToken.save()
      }
    } else {
      await apiToken.destroy()
    }

    await ApiToken.create({
      provider_id: tsId,
      userId,
      name,
      token
    })

    res.json({
      status: 1,
      message: 'success'
    })
  } catch (e) {
    next(e)
  }
}

router.post('/api/tsreference', upsert)

router.put('/api/tsreference/:id', upsert)


router.get('/api/third-traffics', async (req, res, next) => {
  try {
    let providers = await Provider.findAll()
    res.json({
      status: 1,
      message: 'success',
      data: {
        thirdTraffics: providers
      }
    })
  } catch (e) {
    next(e)
  }
})

router.get('/api/tsreport', async (req, res, next) => {
  try {
    let {id: userId} = req.user;
    let {from, to, tsReferenceId: provider_id} = req.query;
    let apiToken = await ApiToken.findOne({where: {userId, provider_id}});
    if (!apiToken) throw new Error('no api token found');

    let rows = await Statistic.findAll({
      attributes: [
        'campaign_id',
        [sequelize.literal('sum(click)'), 'clicks'],
        [sequelize.literal('sum(cost)'), 'cost'],
        [sequelize.literal('sum(impression)'), 'impressions']
      ],
      include: [
        {
          model: Provider,
          required: true
        },
        {
          model: Campaign,
          required: true
        }
      ],
      where: {
        provider_id,
        api_token_id: apiToken.id,
        $and: [
          {date: {$gte: from}},
          {date: {$lte: to}}
        ]
      },
      group: ['campaign_id']
    })

    let result = rows.map(row => {
      return {
        campaignName: row.Campaign.name,
        campaignId: row.Campaign.campaign_identity,
        clicks: parseInt(row.dataValues.clicks),
        cost: parseFloat(row.dataValues.cost).toFixed(2),
        impressions: parseInt(row.dataValues.impressions)
      }
    })
    res.json({
      status: 1,
      message: 'success',
      data: {
        totalRows: result.length,
        rows: result
      }
    })
  } catch (e) {
    next(e);
  }
})

import popads from 'popads';
import zeropark from 'zeropark';
import exoclick from 'exoclick';

const providers = {
  popads,
  zeropark,
  exoclick
}

router.post('/api/tsCampaign/:campaignId', async (req, res, next) => {
  let record
  try {
    let {id: userId} = req.user;
    let campaign_identity = req.params.campaignId;
    let {tsReferenceId: provider_id, action} = req.body;
    record = await ApiToken.findOne({
      where: {
        userId
      },
      include: [
        {
          model: Provider,
          required: true,
          where: {
            id: provider_id,
          },
          include: [
            {
              model: Campaign,
              required: true,
              where: {
                campaign_identity
              }
            }
          ]
        }
      ]
    })
    if (!record) throw new Error('campaign not found');
    let Api = providers[record.Provider.name];
    if (!Api) throw new Error('unknown source');

    let api = new Api(record.token);
    if (!api.campaign[action]) throw new Error('wrong action');
    let result = await api.campaign[action]({campaign_id: campaign_identity});

    res.json({
      status: 1,
      message: 'success'
    });
  } catch (e) {
    if (!record) return next(e);

    if(e.status === 500 && record.Provider.name === 'popads') {
      res.json({
        status: 0,
        message: e.response.body.errors[0].title
      })
    } else if (e.status === 400 && record.Provider.name === 'zeropark'){
      res.json({
        status: 0,
        message: e.response.body.error
      })
    } else {
      next(e)
    }
  }

})
