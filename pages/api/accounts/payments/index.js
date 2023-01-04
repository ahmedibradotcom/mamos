import nc from 'next-connect'
import db from '../../../../config/db'
import { isAuth } from '../../../../utils/auth'
import Transaction from '../../../../models/Transaction'
import Account from '../../../../models/Account'

const handler = nc()
handler.use(isAuth)
handler.get(async (req, res) => {
  await db()
  try {
    const query = async (code) => {
      const account = await Account.findOne({ code })
      // vendors
      let vendors = await Transaction.aggregate([
        {
          $match: {
            account: account._id,
          },
        },
        {
          $group: {
            _id: '$vendor',
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        {
          $lookup: {
            from: 'vendors',
            localField: '_id',
            foreignField: '_id',
            as: 'vendor',
          },
        },
      ])

      vendors = vendors?.map((v) => ({
        _id: v._id,
        totalAmount: v.totalAmount,
        name: v.vendor[0]?.name,
        email: v.vendor[0]?.email,
        type: v.vendor[0]?.type,
      }))

      // customers
      let customers = await Transaction.aggregate([
        {
          $match: {
            account: account._id,
          },
        },
        {
          $group: {
            _id: '$customer',
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
      ])

      customers = customers?.map((c) => ({
        _id: c._id,
        totalAmount: c.totalAmount,
        name: c.user[0]?.name,
        email: c.user[0]?.email,
        type: 'customer',
      }))

      const transactions = [...customers, ...vendors]
      return transactions?.filter((trans) => trans._id)
    }

    const ap = await query(21000)
    const pay = await query(2022)
    // const ar = await query(12100)
    // const exp = await query(50000)
    // const gos = await query(40000)
    // const rec = await query(2023)

    const accountPayable = []
    ap.forEach((aPayable) => {
      if (pay.length < 1) return accountPayable.push(aPayable)
      if (!pay.map((p) => p._id.toString()).includes(aPayable._id.toString()))
        return accountPayable.push(aPayable)

      pay.map((payment) => {
        if (payment._id.toString() === aPayable._id.toString()) {
          accountPayable.push({
            _id: aPayable._id,
            totalAmount: aPayable.totalAmount - payment.totalAmount,
            name: aPayable.name,
            email: aPayable.email,
            type: aPayable.type,
          })
        }
      })
    })

    // const accountReceivable = []
    // ar.forEach((aReceivable) => {
    //   if (rec.length < 1) return accountReceivable.push(aReceivable)
    //   if (
    //     !rec.map((p) => p._id.toString()).includes(aReceivable._id.toString())
    //   )
    //     return accountReceivable.push(aReceivable)

    //   rec.map((payment) => {
    //     if (payment._id.toString() === aReceivable._id.toString()) {
    //       accountReceivable.push({
    //         _id: aReceivable._id,
    //         totalAmount: aReceivable.totalAmount - payment.totalAmount,
    //         name: aReceivable.name,
    //         email: aReceivable.email,
    //         type: aReceivable.type,
    //       })
    //     }
    //   })
    // })

    // res.json({ ap, ar, exp, gos, pay, rec })
    res.json(accountPayable?.filter((ap) => ap?.totalAmount > 0))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

handler.use(isAuth)

export default handler
