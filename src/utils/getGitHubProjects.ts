import * as core from '@actions/core'
import { Octokit } from '@octokit/core'
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql'

// This function list all issue types available in all of the repositories
export async function getGitHubProjects(
  reposList: GitHubRepo[]
): Promise<GitHubProject[]> {
  const inputGithubToken = core.getInput('token')
  const MyOctokit = Octokit.plugin(paginateGraphQL)
  const octokit = new MyOctokit({ auth: inputGithubToken })

  const gitHubOrgs: GitHubOrg[] = []
  for (const repo of reposList) {
    if (!gitHubOrgs.find((o) => o.login === repo.organization.login)) {
      gitHubOrgs.push(repo.organization)
    }
  }

  core.info(`Projects: Retrieving existing projects from GitHub`)
  const gitHubProjects: GitHubProject[] = []
  for (const org of gitHubOrgs) {
    core.info(`Projects: Processing org: ${org.login}`)
    const projects = await octokit.graphql<{
      node: {
        projectsV2: {
          nodes: { id: string; title: string; url: string }[]
        }
      }
    }>(
      `
      query($orgId: ID! $cursor: String) {
        node(id: $orgId) {
          ... on Organization {
            id
            projectsV2(first: 30, after: $cursor, query: "is:open") {
              totalCount
              nodes {
                id
                title
                url
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }           
          }
        }
      }
    `,
      {
        orgId: org.node_id
      }
    )
    for (const project of projects.node.projectsV2.nodes) {
      if (
        !gitHubProjects.find(
          (p) => p.id === project.id && p.organization.id === org.node_id
        )
      ) {
        gitHubProjects.push({ ...project, organization: org })
      }
    }
  }
  core.info(
    `Projects: Unique projects found in GitHub: ${gitHubProjects.length}`
  )
  return gitHubProjects
}
