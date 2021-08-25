import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import fs from 'fs'
import tmp from 'tmp'

export async function clone (url: string): Promise<string> {
  const dir = tmp.dirSync().name
  try {
    await git.clone({fs, http, dir, url})
  } catch (e) {
    if (!url.endsWith('.git') && e.toString().includes('404')) {
      url = url + '.git'
      await git.clone({fs, http, dir, url})
    } else {
      throw e
    }
  }
  return dir
}