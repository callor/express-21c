import path from 'path'
import fs from 'fs'
import readline from 'readline'
import mkdirp from 'mkdirp'
import minimatch from 'minimatch'

// ejs file render
import ejs from 'ejs'
// ESCAPE
import util from 'util'

const packageJSON = new URL('../package.json', import.meta.url)
const packageData = fs.readFileSync(packageJSON, 'utf-8')
const VERSION = JSON.parse(packageData).version

const MODE_0666 = parseInt('0666', 8)
const MODE_0755 = parseInt('0755', 8)
const tempURL = new URL('../templates', import.meta.url) // path.join("templates");
const TEMPLATE_DIR =
  process.platform === 'win32'
    ? tempURL.pathname.substring(1)
    : tempURL.pathname

// console confirm blocking input
const confirm = (msg, cb) => {
  const keyInput = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  keyInput.question(msg, (key) => {
    keyInput.close()
    cb(/^y|yes|ok|true$/i.test(key))
  })
}

const mkdir = (base, dir) => {
  const localDir = path.join(base, dir)

  // Ansi Console Text
  console.log(`   \x1b[36mcreate\x1b[0m : ${localDir}${path.sep}`)
  mkdirp.sync(localDir, MODE_0755)
}

// fileRead
const loadTemplate = (tempName) => {
  const tempFile = path.join(TEMPLATE_DIR, tempName + '.ejs')
  console.log(tempFile)
  const contents = fs.readFileSync(tempFile, 'utf-8')
  const locals = {} // Object.create(null);
  const render = () => {
    return ejs.render(contents, locals, {
      escape: util.inspect,
    })
  }

  return {
    locals: locals,
    render: render,
  }
}

const fileWrite = (file, str, mode) => {
  fs.writeFileSync(file, str, { mode: mode || MODE_0666 })
  console.log('   \x1b[36mcreate\x1b[0m : ' + file)
}

const copyTemplate = (from, to) => {
  fileWrite(to, fs.readFileSync(path.join(TEMPLATE_DIR, from), 'utf-8'))
}

// Copy multiple files from template directory.
const copyTemplateMulti = (fromDir, toDir, nameGlob) => {
  fs.readdirSync(path.join(TEMPLATE_DIR, fromDir))
    .filter(minimatch.filter(nameGlob, { matchBase: true }))
    .forEach(function (name) {
      copyTemplate(path.join(fromDir, name), path.join(toDir, name))
    })
}

const finish = (dir, appName, app = null) => {
  const launchedCmd =
    process.platform === 'win32' && process.env._ === undefined

  const prompt = launchedCmd ? '>' : '$'

  if (dir !== '.') {
    console.log()
    console.log('   change directory:')
    console.log('     %s cd %s', prompt, dir)
  }

  if (app?.locals.sequelizeModuesList.DB) {
    console.log()
    console.log('   set the database config:')
    console.log('     %s edit ./%s/config/db_config.js', prompt, dir)
  }

  console.log()
  console.log('   install dependencies:')
  console.log('     %s npm install', prompt)
  console.log()
  console.log('   run the app:')

  if (launchedCmd) {
    console.log('     %s SET DEBUG=%s:* & npm start', prompt, appName)
  } else {
    console.log('     %s DEBUG=%s:* npm start', prompt, appName)
  }
}

export {
  VERSION,
  confirm,
  mkdir,
  loadTemplate,
  fileWrite,
  copyTemplate,
  copyTemplateMulti,
  finish,
}
