const fs = require('fs')
const formidable = require('formidable')

module.exports = {
  savePhoto: (req, res) => {
    const form = new formidable.IncomingForm()
    let finalName = ''
    form.parse(req)
    form.on('fileBegin', function (name, file) {
      const newName = Date.now()
      const extension = file.name.split('.').pop()
      finalName = newName + '.' + extension
      const fullPath = 'public/uploads/'
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
      file.path = fullPath + finalName
    })
    form.on('file', function () {
      // Return a clean JSON response with the filename
      res.status(200).json({ filename: finalName });
    })
  },

  handleNotFound: (req, res, next) => {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
  },

  // eslint-disable-next-line max-params, no-unused-vars
  handleDefaultError: (err, req, res, next) => {
    res.status(err.status || 500)
    res.render('error.ejs', {
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err : {},
    })
  },
}
