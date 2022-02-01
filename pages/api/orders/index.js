import nc from 'next-connect'
import dbConnect from '../../../utils/db'
import Group from '../../../models/Group'
import { isAuth } from '../../../utils/auth'
import fileUpload from 'express-fileupload'
import { upload } from '../../../utils/fileManager'
export const config = { api: { bodyParser: false } }
import autoIncrement from '../../../utils/autoIncrement'
import Order from '../../../models/Order'

const handler = nc()
handler.use(fileUpload())

handler.use(isAuth)
handler.post(async (req, res) => {
  await dbConnect()
  const createdBy = req.user.id
  console.log(req.body)

  const invoiceFile = req.files && req.files.invoiceFile
  const { buyerAddress, buyerEmail, buyerMobileNumber, buyerName } = req.body
  const { cargoDescription, cargoType } = req.body
  const {
    destAddress,
    destCity,
    destCountry,
    destPort,
    destPostalCode,
    destWarehouseName,
    dropOffTown,
  } = req.body
  const {
    pickUpAddress,
    pickUpCity,
    pickUpPostalCode,
    pickUpTown,
    pickUpWarehouseName,
    pickupCountry,
    pickupPort,
  } = req.body
  const {
    grossWeight,
    importExport,
    isHasInvoice,
    isTemperatureControlled,
    movementType,
    noOfPackages,
    transportationType,
    commodity,
  } = req.body

  const buyer = {
    buyerAddress,
    buyerEmail,
    buyerMobileNumber,
    buyerName,
  }
  const destination = {
    destAddress,
    destCity,
    destCountry,
    destPort,
    destPostalCode,
    destWarehouseName,
    dropOffTown,
  }
  const pickup = {
    pickUpAddress,
    pickUpCity,
    pickUpPostalCode,
    pickUpTown,
    pickUpWarehouseName,
    pickupCountry,
    pickupPort,
  }

  const lastRecord = await Order.findOne(
    {},
    { trackingNo: 1 },
    { sort: { createdAt: -1 } }
  )

  const trackingNo = lastRecord
    ? autoIncrement(lastRecord.trackingNo)
    : autoIncrement('MB000000')

  if (invoiceFile) {
    const invoice = await upload({
      fileName: invoiceFile,
      fileType: 'image',
      pathName: 'invoice',
    })

    if (invoice) {
      if (cargoType === 'FCL') {
        const FCLData = {
          destination,
          pickup,
          buyer,
          grossWeight,
          importExport,
          isHasInvoice,
          isTemperatureControlled,
          movementType,
          noOfPackages,
          transportationType,
          commodity,
          cargoDescription,
          cargoType,
          createdBy,
          trackingNo,
          invoiceFile: {
            invoiceFileName: invoice.fullFileName,
            invoiceFilePath: invoice.filePath,
          },
        }
        const createObj = await Order.create(FCLData)
        if (createObj) {
          res.status(201).json({ status: 'success' })
        } else {
          return res.status(400).send('Invalid data')
        }
      }
    }
  }
  if (!invoiceFile) {
    if (cargoType === 'FCL') {
      const FCLData = {
        destination,
        pickup,
        buyer,
        grossWeight,
        importExport,
        isHasInvoice,
        isTemperatureControlled,
        movementType,
        noOfPackages,
        transportationType,
        commodity,
        cargoDescription,
        cargoType,
        createdBy,
        trackingNo,
      }
      const createObj = await Order.create(FCLData)
      if (createObj) {
        res.status(201).json({ status: 'success' })
      } else {
        return res.status(400).send('Invalid data')
      }
    }
  }
})

export default handler
