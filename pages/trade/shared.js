import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import withAuth from '../../HOC/withAuth'
import Message from '../../components/Message'
import Loader from 'react-loader-spinner'
import { FaDollarSign, FaInfoCircle, FaShareAlt } from 'react-icons/fa'
import { inputTextArea } from '../../utils/dynamicForm'
import useTrades from '../../api/trades'
import moment from 'moment'
import { useForm } from 'react-hook-form'

const Trade = () => {
  const { getSharedByEmployee, updatePriceTrade } = useTrades()
  const [trade, setTrade] = useState({})
  const [id, setId] = useState('')

  const { data, isLoading, isError, error } = getSharedByEmployee
  const {
    isLoading: isLoadingPrice,
    isSuccess: isSuccessPrice,
    isError: isErrorPrice,
    error: errorPrice,
    mutateAsync,
  } = updatePriceTrade

  const editHandler = (trade) => {
    setEdit(true)
    setTrade(trade)
  }
  const priceHandler = (trade) => {
    setEdit(false)
    setId(trade._id)
    setTrade(trade)
  }
  const [edit, setEdit] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {},
  })

  const submitHandler = async (data) => {
    mutateAsync({ _id: id, evaluation: data.evaluation, status: 'evaluated' })
  }

  useEffect(() => {
    if (isSuccessPrice) {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessPrice])

  return (
    <>
      <Head>
        <title>Shared Trades</title>
        <meta property='og:title' content='Shared Trades' key='title' />
      </Head>

      {isSuccessPrice && (
        <Message variant='success'>
          Trade price has been updated successfully
        </Message>
      )}
      {isErrorPrice && <Message variant='danger'>{errorPrice}</Message>}

      <div
        className='modal fade'
        id='editTradeModal'
        data-bs-backdrop='static'
        data-bs-keyboard='false'
        tabIndex='-1'
        aria-labelledby='editTradeModalLabel'
        aria-hidden='true'
      >
        <div className='modal-dialog'>
          <div className='modal-content modal-background'>
            <div className='modal-header'>
              <h3 className='modal-title ' id='editTradeModalLabel'>
                Trade Details
              </h3>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body'>
              {isLoading ? (
                <div className='text-center'>
                  <Loader
                    type='ThreeDots'
                    color='#00BFFF'
                    height={100}
                    width={100}
                    timeout={3000} //3 secs
                  />
                </div>
              ) : isError ? (
                <Message variant='danger'>{error}</Message>
              ) : (
                <form onSubmit={handleSubmit(submitHandler)}>
                  <>
                    {!edit &&
                      inputTextArea({
                        register,
                        errors,
                        name: 'evaluation',
                        label: 'Price Description',
                      })}

                    {edit && trade && (
                      <div className='row gy-3'>
                        <div className='col-12'>
                          {/* customer name */}
                          <div>
                            <span className='fw-bold'>Customer Name:</span>
                            <br />
                            <span>
                              {trade.createdBy && trade.createdBy.name}
                            </span>
                          </div>

                          <div>
                            <span className='fw-bold'>Order Date:</span>
                            <br />
                            <span>{moment(trade.createdAt).format('ll')}</span>
                          </div>

                          <div>
                            <span className='fw-bold'>
                              Description & Links:
                            </span>
                            <br />
                            <span>{trade.description}</span>
                          </div>

                          {trade.files && (
                            <div>
                              {trade.files.map((file, index) => (
                                <div key={index}>
                                  <Image
                                    className='img-fluid'
                                    width='300'
                                    height='300'
                                    src={file.filePath}
                                    alt={file.fullFileName}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className='modal-footer'>
                      <button
                        type='button'
                        className='btn btn-secondary '
                        data-bs-dismiss='modal'
                      >
                        Close
                      </button>
                      {!edit && (
                        <button
                          type='submit'
                          className='btn btn-primary '
                          disabled={isLoadingPrice}
                        >
                          {isLoadingPrice ? (
                            <span className='spinner-border spinner-border-sm' />
                          ) : (
                            'Submit'
                          )}
                        </button>
                      )}
                    </div>
                  </>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='row mt-2'>
        <div className='col-md-4 col-6 me-auto'>
          <h3 className='fw-light font-monospace'>Trades</h3>
        </div>
      </div>

      {isLoading ? (
        <div className='text-center'>
          <Loader
            type='ThreeDots'
            color='#00BFFF'
            height={100}
            width={100}
            timeout={3000} //3 secs
          />
        </div>
      ) : isError ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <div className='table-responsive '>
            <table className='table table-sm hover bordered table-striped caption-top '>
              <caption>{data && data.length} records were found</caption>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>DateTime</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data &&
                  data.map((trade) => (
                    <tr key={trade._id}>
                      <td>{trade.createdBy.name}</td>
                      <td>
                        {trade.status === 'pending' ? (
                          <span className='badge bg-warning'>
                            {trade.status}
                          </span>
                        ) : trade.status === 'accepted' ? (
                          <span className='badge bg-success'>
                            {trade.status} {trade.employee && <FaShareAlt />}
                          </span>
                        ) : trade.status == 'evaluated' ? (
                          <span className='badge bg-info'>{trade.status}</span>
                        ) : trade.status === 'agreed' ? (
                          <span className='badge bg-primary'>
                            {trade.status}
                          </span>
                        ) : (
                          trade.status === 'completed' && (
                            <span className='badge bg-success'>
                              {trade.status}
                            </span>
                          )
                        )}
                      </td>
                      <td>{moment(trade.createdAt).format('lll')}</td>

                      <td className='btn-group'>
                        <button
                          className='btn btn-primary btn-sm rounded-pill '
                          onClick={() => editHandler(trade)}
                          data-bs-toggle='modal'
                          data-bs-target='#editTradeModal'
                        >
                          <FaInfoCircle />
                        </button>
                        {trade.status !== 'agreed' && (
                          <button
                            className='btn btn-primary btn-sm rounded-pill ms-1'
                            onClick={() => priceHandler(trade)}
                            data-bs-toggle='modal'
                            data-bs-target='#editTradeModal'
                          >
                            <FaDollarSign />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

export default dynamic(() => Promise.resolve(withAuth(Trade)), {
  ssr: false,
})