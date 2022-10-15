import nc from 'next-connect'
import db from '../../../../config/db'
import Seaport from '../../../../models/Seaport'
import Country from '../../../../models/Country'
import { isAuth } from '../../../../utils/auth'

const schemaName = Seaport

const handler = nc()
handler.use(isAuth)
handler.get(async (req, res) => {
  await db()
  try {
    const q = req.query && req.query.q

    let query = schemaName.find(q ? { name: { $regex: q, $options: 'i' } } : {})

    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.limit) || 25
    const skip = (page - 1) * pageSize
    const total = await schemaName.countDocuments(
      q ? { name: { $regex: q, $options: 'i' } } : {}
    )

    const pages = Math.ceil(total / pageSize)

    query = query
      .skip(skip)
      .limit(pageSize)
      // .sort({ createdAt: -1 })
      .lean()
      .populate('country', ['name'])

    const result = await query

    res.status(200).json({
      startIndex: skip + 1,
      endIndex: skip + result.length,
      count: result.length,
      page,
      pages,
      total,
      data: result,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

handler.post(async (req, res) => {
  await db()
  try {
    // check if status is active
    if (req.body.country) {
      const obj = await Country.findOne({
        country: req.body.country,
        status: 'active',
      })
      if (!obj) return res.status(404).json({ error: 'Country not found' })
    }

    // check existence of object
    const exist = await schemaName.findOne({
      name: { $regex: `^${req.body.name.trim()}$`, $options: 'i' },
      country: req.body.country,
    })

    if (exist)
      return res.status(400).json({ error: 'Duplicate value detected' })

    const object = await schemaName.create({
      ...req.body,
      createdBy: req.user._id,
    })
    res.status(200).send(object)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default handler
