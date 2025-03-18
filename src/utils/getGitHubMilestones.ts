import * as core from '@actions/core'
import { Octokit } from '@octokit/core'
// https://github.com/octokit/plugin-paginate-rest.js/
import { paginateRest } from '@octokit/plugin-paginate-rest'

// This function checks if the provided repositories do exist
export async function getGitHubMilestones(
  githubRepos: GitHubRepo[]
): Promise<GitHubMilestone[]> {
  const inputGithubToken = core.getInput('token')
  const MyOctokit = Octokit.plugin(paginateRest)
  const octokit = new MyOctokit({ auth: inputGithubToken })

  core.info(`Milestones: Retrieving existing milestones from GitHub`)
  const gitHubMilestones: GitHubMilestone[] = []
  for (const repo of githubRepos) {
    const [owner, repoName] = repo.full_name.split('/')
    try {
      const milestones = await octokit.paginate(
        'GET /repos/{owner}/{repo}/milestones',
        {
          owner: owner,
          repo: repoName,
          per_page: 100
        }
      )
      core.info(
        `Milestones: ${repo.full_name}: ${milestones.length} milestones found`
      )
      for (const milestone of milestones) {
        gitHubMilestones.push({ ...milestone, repository: repo })
      }
    } catch (error) {
      core.warning(`Unable to fetch milestones from repo: ${repo.full_name}`)
      core.warning(`Error: ${(error as Error).message}`)
    }
  }
  core.info(
    `Milestones: Unique milestones found in GitHub: ${gitHubMilestones.length}`
  )
  return gitHubMilestones
}
