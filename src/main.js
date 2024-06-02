const core = require('@actions/core')
const { wait } = require('./wait')
const { getExistingReleases, updateAptRepo } = require('./apt-repo-manager')
const { crawlReposAndGetReleases } = require('./release-crawler')
const { downloadDeb, signDeb } = require('./deb-manager')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const repositoriesRaw = core.getInput('repositories', { required: true })
    const repoArray = repositoriesRaw.split(',')
    const signingKey = core.getInput('signing_key', { required: false })
    const signinKeyPath = core.getInput('signing_key_path', {
      required: signingKey == null
    })
    const signingKeyPassword = core.getInput('signing_key_password', {
      required: true
    })
    const outputFolder = core.getInput('output_folder', {
      required: true
    })
    const signing_key_id = core.getInput('signing_key_id', {
      required: false
    })

    const existingReleases = await getExistingReleases({
      aptRepoPath: outputFolder
    })

    const newReleases = await crawlReposAndGetReleases({
      existingReleases,
      repositories: repoArray
    })

    for (const deb of newReleases) {
      const localPath = await downloadDeb({
        deb,
        aptRepoPath: outputFolder
      })
      await signDeb({
        path: localPath
      })
    }
    await updateAptRepo({
      newReleases,
      aptRepoPath: outputFolder
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
