import * as core from '@actions/core'
import * as github from '@actions/github'

const sleep = (milliseconds: number): Promise<string> => {
  return new Promise((resolve) => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number')
    }

    setTimeout(() => resolve('done!'), milliseconds)
  })
}

const attachTypeToIssue = async (issueId: string, issueTypeId: string) => {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  const attachedIssueType = await octokit.graphql<{
    updateIssue: {
      issue: {
        id: string
        url: string
      }
    }
  }>(
    `
    mutation {
        updateIssue(input: {
          id: "${issueId}",
          issueTypeId: "${issueTypeId}",
        }) {
          issue {
            id
            url
          }                     
        }
      }
  `,
    {
      // See doc about issue types: https://github.com/orgs/community/discussions/139933
      headers: {
        'GraphQL-Features': 'issue_types'
      }
    }
  )
  return attachedIssueType.updateIssue
}

const addChildrenToIssue = async (issueId: string, subIssueId: string) => {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  const addSubIssue = await octokit.graphql<{
    addSubIssue: {
      issue: { id: string; url: string }
      subIssue: { id: string; url: string }
    }
  }>(`
    mutation {
        addSubIssue(input: {
          issueId: "${issueId}",
          subIssueId: "${subIssueId}",
        }) {
          issue {
            id
            url
          }
          subIssue {
            id
            url
          }                      
        }
      }
  `)

  return addSubIssue.addSubIssue
}

const addProjectToIssue = async (issueId: string, projectId: string) => {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  const addProject = await octokit.graphql<{
    addProjectV2ItemById: {
      clientMutationId: string
      item: { id: string }
    }
  }>(`
    mutation {
        addProjectV2ItemById(input: {
          contentId: "${issueId}",
          projectId: "${projectId}",
        }) {
          clientMutationId
          item {
            id
          }                     
        }
      }
  `)

  return addProject.addProjectV2ItemById
}

// This function checks if the provided repositories do exist
export async function createGitHubIssues(
  issues: ConfigIssue[],
  milestones: GitHubMilestone[],
  issueTypes: GitHubIssueType[],
  githubProjects: GitHubProject[]
): Promise<ConfigIssue[]> {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  const createdIssues: ConfigIssue[] = []
  for (const issue of issues) {
    let childrenIssues: ConfigIssue[] = []
    if (issue.children) {
      childrenIssues = await createGitHubIssues(
        issue.children,
        milestones,
        issueTypes,
        githubProjects
      )
    }
    const [owner, repo] = issue.repository.split('/')
    try {
      const milestone = milestones.find(
        (m) =>
          m.title === issue.milestone &&
          m.repository.full_name === issue.repository
      )
      if (!milestone) {
        core.setFailed(
          `Milestone ${issue.milestone} not found in repository ${issue.repository}`
        )
      } else {
        const createdIssue = await octokit.rest.issues.create({
          owner,
          repo,
          title: issue.title,
          body: issue.description,
          labels: issue.labels,
          milestone: milestone.number,
          assignees: issue.assignees
        })
        core.info(`Created issue: ${createdIssue.data.html_url}`)

        if (issue.type) {
          const issueType = issueTypes.find(
            (it) =>
              it.name === issue.type &&
              it.repository.full_name === issue.repository
          )
          if (issueType !== undefined) {
            let errorRetry = 0
            while (errorRetry < 3) {
              const attachIssueType = await attachTypeToIssue(
                createdIssue.data.node_id,
                issueType.id
              )
              if (attachIssueType !== undefined && attachIssueType !== null) {
                core.info(
                  `Attached type ${issue.type} to issue ${createdIssue.data.html_url}`
                )
                break
              } else {
                core.info(
                  `Unable to attach type ${issue.type} to issue ${createdIssue.data.html_url}, retrying (${errorRetry}/3)`
                )
                await sleep(250)
                errorRetry++
              }
            }
          }
        } else {
          core.info(`Issue type not provided, skipping`)
        }

        if (issue.project !== undefined) {
          const issueProject = githubProjects.find(
            (it) =>
              issue.project !== undefined && it.title === issue.project.title
          )
          if (issueProject !== undefined) {
            let errorRetry = 0
            while (errorRetry < 3) {
              const attachProject = await addProjectToIssue(
                createdIssue.data.node_id,
                issueProject.id
              )
              if (attachProject !== undefined && attachProject !== null) {
                core.info(
                  `Attached project ${issue.project.title} to issue ${createdIssue.data.html_url}`
                )
                break
              } else {
                core.info(
                  `Unable to attach project ${issue.project.title} to issue ${createdIssue.data.html_url}, retrying (${errorRetry}/3)`
                )
                await sleep(250)
                errorRetry++
              }
            }
          }
        } else {
          core.info(`Issue project not provided, skipping`)
        }

        if (childrenIssues.length > 0) {
          // If there are children issues, creating the sub issue link
          for (const childIssue of childrenIssues) {
            if (childIssue.github !== undefined) {
              let errorRetry = 0
              while (errorRetry < 3) {
                const attachChildIssue = await addChildrenToIssue(
                  createdIssue.data.node_id,
                  childIssue.github.node_id
                )
                if (
                  attachChildIssue !== undefined &&
                  attachChildIssue !== null
                ) {
                  core.info(
                    `Link to sub issue ID ${childIssue.github.node_id} created in issue ${createdIssue.data.node_id}`
                  )
                  break
                } else {
                  core.info(
                    `Unable to attach type ${issue.type} to issue ${createdIssue.data.html_url}, retrying (${errorRetry}/3)`
                  )
                  await sleep(250)
                  errorRetry++
                }
              }
            }
          }
          createdIssues.push({
            ...issue,
            children: childrenIssues,
            github: createdIssue.data
          })
        } else {
          createdIssues.push({
            ...issue,
            github: createdIssue.data
          })
        }
      }
    } catch (error) {
      console.log(error)
      core.setFailed(`Error when creating the issues`)
    }
  }
  return createdIssues
}
