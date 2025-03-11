import * as core from '@actions/core'
import * as github from '@actions/github'

// This function list all issue types available in all of the repositories
export async function getGitHubIssueTypes(
  reposList: GitHubRepo[]
): Promise<GitHubIssueType[]> {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  const gitHubIssueTypes: GitHubIssueType[] = []
  for (const repository of reposList) {
    const repoIssueTypes = await octokit.graphql<{
      node: {
        id: string
        issueTypes: {
          nodes: {
            id: string
            name: string
            isEnabled: boolean
          }[]
        }
      }
    }>(
      `
      query($repoId: ID!) {
        node(id: $repoId) {
          ... on Repository {
            id
            issueTypes(first: 100) {
              nodes {
                id
                name
                isEnabled
              }
            }            
          }
        }
      }
    `,
      {
        repoId: repository.node_id,
        // See doc about issue types: https://github.com/orgs/community/discussions/139933
        headers: {
          'GraphQL-Features': 'issue_types'
        }
      }
    )
    for (const issueType of repoIssueTypes.node.issueTypes.nodes) {
      if (
        !gitHubIssueTypes.find(
          (it) =>
            it.id === issueType.id &&
            it.repository.full_name === repository.full_name
        )
      ) {
        gitHubIssueTypes.push({ ...issueType, repository: repository })
      }
    }
  }
  return gitHubIssueTypes
}
