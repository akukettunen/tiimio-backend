const { listByKey  } = '../aws/index'

const deleteVideoFromS3 = async key => {
  const keys = await listByKey(key)

  console.log(keys)
}