import * as core from '@actions/core'
import * as github from '@actions/github'

// This function checks if the provided repositories do exist
export async function createGitHubIssues(
  issues: ConfigIssue[],
  milestones: GitHubMilestone[],
  issueTypes: GitHubIssueType[]
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
        issueTypes
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
            const attachIssueType = await octokit.graphql<{
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
                    id: "${createdIssue.data.node_id}",
                    issueTypeId: "${issueType.id}",
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
            core.info(
              `Attached type ${issue.type} to issue ${attachIssueType.updateIssue.issue.url}`
            )
          }
        } else {
          core.info(`Issue type not provided, skipping`)
        }
        if (childrenIssues.length > 0) {
          // If there are children issues, creating the sub issue link
          for (const childIssue of childrenIssues) {
            if (childIssue.github !== undefined) {
              const addSubIssue = await octokit.graphql<{
                addSubIssue: {
                  issue: { id: string; url: string }
                  subIssue: { id: string; url: string }
                }
              }>(`
                mutation {
                    addSubIssue(input: {
                      issueId: "${createdIssue.data.node_id}",
                      subIssueId: "${childIssue.github.node_id}",
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
              core.info(
                `Link to sub issue ${addSubIssue.addSubIssue.subIssue.url} created in issue ${addSubIssue.addSubIssue.issue.url}`
              )
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
