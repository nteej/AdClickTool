import express from 'express';
const router = express.Router();

export default router;

const {
  UserBilling: UB,
  TemplatePlan: TB,
  User,
  UserBillDetail: UBD
} = models;

router.get('/api/billing', async (req, res) => {
  let {userId} = req;
  let billing = await UB.findOne({where: {userId, expired: 0}})
  if (!billing) {
    return res.json({
      status: 1,
      message: 'success',
      data: {}
    })
  }
  let template_plan = await TB.findOne({where: {id: billing.planId}})
  res.json(
    {
      status: 1,
      message: 'success',
      data: {
        plan: {
          id: template_plan.id,
          name: template_plan.name,
          price: template_plan.normalPrice || template_plan.onSalePrice
        },
        statistic: {
          planCode: template_plan.name,
          billedEvents: billing.billedEvents,
          totalEvents: billing.totalEvents,
          overageEvents: billing.overageEvents,
          overageCost: 0,
          includedEvents: billing.includedEvents,
          remainEvents: (billing.includedEvents - billing.totalEvents),
          freeEvents: billing.freeEvents,
        }
      }
    }
  )
})

router.get('/api/billing/info', async (req, res, next) => {
  try {
    let {userId} = req;
    let user_bill_detail = await UBD.findOne({where: {userId}}) || {}
    res.json({
      status: 1,
      message: 'success',
      data: {
        billingname: user_bill_detail.name,
        addressline1: user_bill_detail.address1,
        addressline2: user_bill_detail.address2,
        city: user_bill_detail.city,
        postalcode: user_bill_detail.zip,
        stateregion: user_bill_detail.region,
        country: user_bill_detail.country,
        ssntaxvatid: user_bill_detail.taxId
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/api/billing/info', async (req, res, next) => {
  try {
    let {userId} = req;
    let {body} = req;
    let user_bill_detail = await UBD.findOne({where: {userId}});
    if (!user_bill_detail) user_bill_detail = UBD.build({userId});
    user_bill_detail.name = (body.billingname || "").trim();
    user_bill_detail.address1 = (body.addressline1 || "").trim();
    user_bill_detail.address2 = (body.addressline2 || "").trim();
    user_bill_detail.city = (body.city || "").trim();
    user_bill_detail.zip = (body.postalcode || "").trim();
    user_bill_detail.region = (body.stateregion || "").trim();
    user_bill_detail.country = (body.country || "").trim();
    user_bill_detail.taxId = (body.ssntaxvatid || "").trim();
    console.log(body, user_bill_detail)
    await user_bill_detail.save();
    res.json({
      status: 1,
      message: 'success'
    })
  } catch (e) {
    next(e)
  }
})

router.get('/api/invoices', async (req, res, next) => {
  try {
    let {userId} = req;

    let user = await User.findById(userId);
    if (!user) throw new Error('invalid user');

    let billing = await UB.findOne({where: {userId, expired: 0}});
    if (!billing) throw new Error('no billing')

    let template_plan = await TB.findOne({where: {id: billing.planId}});
    if (!template_plan) throw new Error('no plan')

    res.json({
      status: 1,
      message: 'success',
      data: {
        email: user.email,
        accountbalance: template_plan.normalPrice
      }
    })
  } catch (e) {
    res.json({
      status: 0,
      message: 'fail'
    })
  }
})
