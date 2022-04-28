const core = require('@actions/core')
const fs = require('fs')
const execa = require('execa')
const split = require('argv-split')

void async function main() {
  try {
    ssh()
    await dep()
  } catch (err) {
    core.setFailed(err.message)
  }
}()

async function ssh() {
  let ssh = `${process.env['HOME']}/.ssh`

  if (!fs.existsSync(ssh)) {
    fs.mkdirSync(ssh)
    let authSock = '/tmp/ssh-auth.sock'
    execa.sync('ssh-agent', ['-a', authSock])
    core.exportVariable('SSH_AUTH_SOCK', authSock)
  }

  let privateKey = core.getInput('private-key').replace('/\r/g', '').trim() + '\n'
  execa.sync('ssh-add', ['-'], {input: privateKey})

  let knownHosts = core.getInput('known-hosts')
  if (knownHosts === '') {
    fs.appendFileSync(`${ssh}/config`, `StrictHostKeyChecking no`)
  } else {
    fs.appendFileSync(`${ssh}/known_hosts`, knownHosts)
    fs.chmodSync(`${ssh}/known_hosts`, '644')
  }
}

function getDep() {
  let dep = null

  for (let c of ['./vendor/bin/dep', 'bin/dep', './deployer.phar']) {
    if (fs.existsSync(c)) {
      dep = c
      break
    }
  }

  if (!dep && execa.commandSync('which deployer').exitCode === 0) {
    dep = 'deployer'
  }

  if (!dep && execa.commandSync('which dep').exitCode === 0) {
    dep = 'dep'
  }

  if (!dep) {
    let url = 'https://deployer.org/deployer.phar';
    if (core.getInput('version')) {
      url = `https://deployer.org/releases/v${core.getInput('version')}/deployer.phar`;
    }
    execa.commandSync(`curl -LO ${url}`)
    dep = './deployer.phar'
  }

  return dep
}

async function dep() {
  const dep = getDep();

  execa.sync(dep, ['-V'])
  const output = await execa(dep, split(core.getInput('dep'))).stdout.pipe(process.stdout)

  output.exitCode === 0
    ? core.info(output.stdout.toString())
    : core.error(output.stderr.toString());
}
