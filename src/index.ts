import http from 'http'
import handler from 'serve-handler'
import * as git from './git.js'
import { Client as HyperspaceClient } from 'hyperspace'
import { createWsProxy } from '@atek-cloud/node-rpc'
import hyperdrive from 'hyperdrive'

let sourceUrl = process.env.SOURCE_URL
if (!sourceUrl) throw new Error('Must provide SOURCE_URL config')
if (sourceUrl.startsWith('/')) sourceUrl = `file://${sourceUrl}`

enum ServeMode { FILE, GIT, HYPERDRIVE }
let serveMode: ServeMode|undefined = undefined
let drive: any = undefined
if (sourceUrl.startsWith('file://')) {
  // FILE
  serveMode = ServeMode.FILE
} else if (sourceUrl.startsWith('https://')) {
  // GIT
  serveMode = ServeMode.GIT
  console.log('Cloning', sourceUrl)
  const dirpath = await git.clone(sourceUrl)
  console.log('...cloned to temporary directory:', dirpath)
  sourceUrl = `file://${dirpath}`
} else if (sourceUrl.startsWith('hyper://')) {
  // HYPERDRIVE
  serveMode = ServeMode.HYPERDRIVE
  const client = new HyperspaceClient(createWsProxy({api: 'atek.cloud/hypercore-api'}))
  await client.ready()
  console.log('Hyperspace daemon connected, status:')
  console.log(await client.status())
  const keyStr = /[0-9a-f]{64}/.exec(sourceUrl)?.[0]
  if (!keyStr) throw new Error('Invalid hyper:// URL')
  drive = hyperdrive(client.corestore(), keyStr, {extension: false})
  await drive.promises.ready()
  await client.replicate(drive)
} else {
  throw new Error('Invalid SOURCE_URL. Must be file path, git repo (https:), or hyperdrive (hyper:)')
}

const PORT = Number(process.env.ATEK_ASSIGNED_PORT)
http.createServer((req, res) => {
  if (req.method === 'HEAD') {
    return res.writeHead(204).end()
  }
  console.log('got request', req.url)
  if (serveMode === ServeMode.FILE || serveMode === ServeMode.GIT) {
    handler(req, res, {public: sourceUrl?.slice('file://'.length)})
  } else if (serveMode === ServeMode.HYPERDRIVE) {
    handler(req, res, {public: '/'}, {
      // @ts-ignore -prf
      lstat (path: string): Promise<any> {
        return drive.promises.lstat(path)
      },
      // @ts-ignore -prf
      createReadStream (path: string, options?: any): any {
        return drive.createReadStream(path, options)
      },
      // @ts-ignore -prf
      readdir (path: string, options: any): Promise<any> {
        return drive.promises.readdir(path, options)
      },
      // @ts-ignore -prf
      realpath (path: string, options: any): string {
        return path
      }
    })
  }
}).listen(PORT, () => {
  console.log(`Statek server running at: http://localhost:${PORT}/`)
  console.log('  Serving:', process.env.SOURCE_URL)
})