import * as core from '@actions/core'
import * as github from '@actions/github'

// This function checks if the provided repositories do exist
export async function createGitHubMilestone(title: string, repository: string) {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  const [owner, repo] = repository.split('/')
  try {
    await octokit.rest.issues.createMilestone({
      owner,
      repo,
      title: title
    })
    core.info(`Milestone ${title} in repository ${repository} created`)
  } catch (error) {
    console.log(error)
    core.setFailed(
      `Unable to create milestone ${title} in repository ${repo}, make sure the user has the necessary permissions.`
    )
  }
}
