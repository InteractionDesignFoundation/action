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
    const ssh = `${process.env['HOME']}/.ssh`

    if (!fs.existsSync(ssh)) {
        fs.mkdirSync(ssh)
        const authSock = '/tmp/ssh-auth.sock'
        execa.sync('ssh-agent', ['-a', authSock])
        core.exportVariable('SSH_AUTH_SOCK', authSock)
    }

    const privateKey = core.getInput('private-key').replace('/\r/g', '').trim() + '\n'
    execa.sync('ssh-add', ['-'], {input: privateKey})

    const knownHosts = core.getInput('known-hosts')
    if (knownHosts === '') {
        fs.appendFileSync(`${ssh}/config`, `StrictHostKeyChecking no`)
    } else {
        fs.appendFileSync(`${ssh}/known_hosts`, knownHosts)
        fs.chmodSync(`${ssh}/known_hosts`, '644')
    }
}

/**
 * @return {Promise<string>}
 */
async function getDeployer() {
    if (core.getInput('path') && core.getInput('version')) {
        throw new Error('Incompatible arguments "path" and "version" detected, please use only of them.')
    }

    if (core.getInput('path')) {
        return core.getInput('path')
    }

    const version = core.getInput('version')
    if (version) {
        return await downloadDeployer(version);
    }

    for (let c of ['./vendor/bin/dep', 'bin/dep', './deployer.phar']) {
        if (fs.existsSync(c)) {
            return c
        }
    }

    try {
        if (execa.commandSync('which deployer').exitCode === 0) {
            return 'deployer'
        }

        if (execa.commandSync('which dep').exitCode === 0) {
            return 'dep'
        }
    } catch (error) {}

    throw new Error('Deployer bin not found. To fix it, please specify `path` or `version` options.')
}

/**
 * @param {string} version
 * @return {Promise<string>} Path to deployer
 */
async function downloadDeployer(version) {
    /** @see https://deployer.org/download */
    const url = version.startWith('6')
        ? `https://deployer.org/releases/v${version}/deployer.phar`
        : `https://github.com/deployphp/deployer/releases/download/v${version}/deployer.phar`

    core.info(`Downloading Deployer v${version} from ${url}`)

    await execa(`curl -LO ${url}`, [], {shell: 'bash', stdio: 'inherit'})
    await execa(`chmod +x ./deployer.phar`, [], {shell: 'bash', stdio: 'inherit'})

    return './deployer.phar'
}

/**
 * @param {string} deployer
 * @return {Promise<void>}
 */
async function runDeployer(deployer) {
    await execa(deployer, ['-V'], {stdio: 'inherit'})

    const depArgs = split(core.getInput('task'))
    const process = await execa(deployer, depArgs, {stdio: 'inherit'})

    if (process.exitCode !== 0) {
        throw new Error(`Deployer exit with error. Exit code: ${process.exitCode}`)
    }
}

main().catch(core.setFailed)
