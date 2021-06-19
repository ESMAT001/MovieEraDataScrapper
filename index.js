const DataGenrator = require('./src/DataGenrator')

const dg = DataGenrator('mongodb://127.0.0.1:27017', { lastPageNo: 1 })

dg.genrate()
