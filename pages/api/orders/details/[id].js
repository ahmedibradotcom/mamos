import nc from 'next-connect'
import dbConnect from '../../../../utils/db'
import Order from '../../../../models/Order'
import { isAuth } from '../../../../utils/auth'

const handler = nc()
handler.use(isAuth)
handler.get(async (req, res) => {
  await dbConnect()
  const { id } = req.query

  const obj = await Order.findOne({ _id: id, createdBy: req.user._id })
    .populate('destination.destCountry')
    .populate('destination.destPort')
    .populate('destination.dropOffTown')
    .populate('pickup.pickUpTown')
    .populate('pickup.pickupCountry')
    .populate('pickup.pickupPort')
    .populate('containerFCL.container')
    .populate('containerLCL.commodity')
    .populate('commodity')
    .populate('shipment')

  res.send(obj)
})

export default handler