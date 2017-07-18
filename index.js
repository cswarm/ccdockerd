/**
 * ccdocker... server.
 *
 * @author Jared Allard <jared@staymarta.com>
 * @version 1.0
 * @license MIT
 * ばか！
 **/

'use strict'

const express = require('express')
const fs      = require('fs-promise')
const path    = require('path')
const mkdirp  = require('mkdirp')
const bodyP   = require('body-parser')

const images  = path.join(__dirname, 'images')

const app = express()

app.use((req, res, next) => {

  /**
   * Error Standardization.
   **/
  res.error = (error = 'None Provided', code = "0011") => {
    return res.send({
      success: false,
      code: code,
      error: errror
    })
  }

  res.success = data => {
    return res.send({
      success: true,
      data: data
    })
  }

  return next()
})

app.use(function(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });

  req.on('end', function() {
    next();
  });
});

mkdirp.sync(images)

app.get('/', (req, res) => {
  return res.send()
})

/**
 * Return the API version.
 **/
app.get('/api/version', (req, res) => {
  return res.send({
    version: '1.0'
  })
})

/**
 * Pull an image.
 **/
app.get('/pull/*', async (req, res) => {
  const unsafePath = req.path.replace(/^\/pull\//g, '')
  const safePath   = path.normalize(unsafePath).replace(/^(\.\.[\/\\])+/, '');
  console.log('send image', safePath)

  const imagePath = path.join(images, safePath)

  try {
    await fs.exists(imagePath)
  } catch(err) {
    console.log('image', safePath, 'not found')
    return res.status(404)
  }

  return res.sendFile(imagePath)
})

/**
 * Upload an image.
 **/
app.post('/push', async (req, res) => {
  const nameReg = /"name":"(\w+)",/ig;
  const verReg  = /"version":"([\d\.]+)"/ig;

  const name    = nameReg.exec(req.rawBody)[1]
  const version = verReg.exec(req.rawBody)[1]

  if(!name || !version) {
    return res.send({
      success: false,
      code:    '0021',
      error:   "Failed to determine name/version"
    })
  }

  const evalPath = path.join(images, `${name}/${version}`)
  const latest   = path.join(images, `${name}/latest`)

  mkdirp.sync(path.join(evalPath, '..'))

  await fs.writeFile(evalPath, req.rawBody)

  // TODO: Latest not just a copy.
  await fs.writeFile(latest, req.rawBody)

  return res.send({
    success: true
  })
})

app.get('/image/:image/versions', async (req, res) => {
  const safePath   = path.normalize(req.params.image).replace(/^(\.\.[\/\\])+/, '');

  if(!safePath) return res.error('Invalid Image')

  const imageDir = path.join(images, safePath);

  const versions = await fs.readdir(imageDir)
  return res.success(versions)
})

app.listen(8081)
