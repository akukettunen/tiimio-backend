log = (i) => {
  console.log(i)
}

success = (i) => {
  console.info(i)
}

error = (e) => { 
  console.error(e)
}

module.exports = { success, error, log }