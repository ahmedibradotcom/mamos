import nc from 'next-connect'
import db from '../../../../config/db'
import Order from '../../../../models/Order'
import { isAuth } from '../../../../utils/auth'

const schemaName = Order

const handler = nc()
handler.use(isAuth)
handler.put(async (req, res) => {
  await db()
  try {
    const { id } = req.query
    const { status, description } = req.body

    const order = await schemaName.findOne({ _id: id, status: 'arrived' })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    order.arrived.status = status
    order.arrived.description = description

    await order.save()

    return res.status(200).send(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default handler
