const core = require('@actions/core')
const fs = require('fs')
const execa = require('execa')
const split = require('argv-split')

async function main() {
    await prepareSSH()
    const deployer = await getDeployer()
    await runDeployer(deployer)
}

async function prepareSSH() {
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

/**
 * @return {Promise<string|*>}
 */
async function getDeployer() {
    if (core.getInput('path')) {
        return core.getInput('path')
    }

    const version = core.getInput('version')
    if (version) {
        /** @see https://deployer.org/download */
        const url = version.startWith('6')
            ? `https://deployer.org/releases/v${version}/deployer.phar`
            : `https://github.com/deployphp/deployer/releases/download/v${version}/deployer.phar`

        core.info(`Downloading Deployer v${version} from ${url}`)

        await execa(`curl -LO ${url}`, [], {shell: 'bash', stdio: 'inherit'})
        return './deployer.phar'
    }

    for (let c of ['./vendor/bin/dep', 'bin/dep', './deployer.phar']) {
        if (fs.existsSync(c)) {
            return c
        }
    }

    if (execa.commandSync('which deployer').exitCode === 0) {
        return 'deployer'
    }

    if (execa.commandSync('which dep').exitCode === 0) {
        return 'dep'
    }

    throw new Error('Deployer bin now found. To fix it, you can specify a "path" or "version" options.')
}

/**
 * @param {string} deployer
 * @return {Promise<void>}
 */
async function runDeployer(deployer) {
    await execa(deployer, ['-V'], {stdio: 'inherit'})

    const depArgs = split(core.getInput('task'))
    const process = await execa(deployer, depArgs, {stdio: 'inherit'})

    process.exitCode === 0
        ? core.info(process.stdout.toString())
        : core.error(process.stderr.toString())
}

main().catch(core.setFailed)
