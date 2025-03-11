import * as core from '@actions/core'
import * as github from '@actions/github'

// This function checks if the provided repositories do exist
export async function getGitHubRepos(
  reposList: string[]
): Promise<GitHubRepo[]> {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  core.info(`Fetching repository data from GitHub`)
  const gitHubRepos: GitHubRepo[] = []
  for (const repo of reposList) {
    const [owner, repoName] = repo.split('/')
    try {
      core.info(`Repository: ${repo}`)
      const githubRepo = await octokit.rest.repos.get({ owner, repo: repoName })
      const repoData = githubRepo.data
      if (repoData.organization === undefined) {
        repoData.organization = null
      }
      const repoDataWithOrg = {
        ...repoData,
        organization: repoData.organization
          ? {
              ...repoData.organization,
              id: repoData.organization.id.toString()
            }
          : null
      }
      gitHubRepos.push(repoDataWithOrg as GitHubRepo)
    } catch (error) {
      core.warning(
        `Unable to find ${repo} in GitHub, verify that the repository exists and the provided token has access.`
      )
      core.warning(`Error: ${(error as Error).message}`)
    }
  }
  return gitHubRepos
}
