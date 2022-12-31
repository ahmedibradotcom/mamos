import nc from 'next-connect'
import db from '../../../../config/db'
import AccountType from '../../../../models/AccountType'
import { isAuth } from '../../../../utils/auth'

const schemaName = AccountType

const handler = nc()
handler.get(async (req, res) => {
  await db()
  try {
    const q = req.query && req.query.q

    let query = schemaName.find(
      q ? { description: { $regex: q, $options: 'i' } } : {}
    )

    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.limit) || 25
    const skip = (page - 1) * pageSize
    const total = await schemaName.countDocuments(
      q ? { description: { $regex: q, $options: 'i' } } : {}
    )

    const pages = Math.ceil(total / pageSize)

    query = query.skip(skip).limit(pageSize).sort({ createdAt: -1 }).lean()

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

handler.use(isAuth)
handler.post(async (req, res) => {
  await db()
  try {
    const { status, name } = req.body

    const exist = await AccountType.findOne({
      name: { $regex: `^${name?.trim()}$`, $options: 'i' },
    })

    if (exist)
      return res.status(400).json({ error: 'Duplicate account type detected' })

    const object = await schemaName.create({
      status,
      name,
      createdBy: req.user._id,
    })

    res.status(200).send(object)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default handler