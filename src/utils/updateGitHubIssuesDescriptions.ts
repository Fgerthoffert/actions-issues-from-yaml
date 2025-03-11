import * as core from '@actions/core'
import * as github from '@actions/github'

const getFlatIssues = (issues: ConfigIssue[], flatIssues: ConfigIssue[]) => {
  for (const issue of issues) {
    flatIssues.push(issue)
    if (issue.children) {
      flatIssues = getFlatIssues(issue.children, flatIssues)
    }
  }
  return flatIssues
}

interface issueId {
  id: string
  html_url: string
}

const updateDescription = (field: string, issueIds: issueId[]) => {
  for (const issueId of issueIds) {
    field = field.replace(`{{ id.${issueId.id} }}`, issueId.html_url)
  }
  return field
}

// This function checks if the provided repositories do exist
export async function updateGitHubIssuesDescriptions(
  issues: ConfigIssue[]
): Promise<ConfigIssue[]> {
  const inputGithubToken = core.getInput('token')
  const octokit = github.getOctokit(inputGithubToken)

  core.info(
    `Updating issues descriptions in GitHub for issues containing other issues ids`
  )

  // Create a flat list of issues
  const flatIssues = getFlatIssues(issues, [])

  // Recursively collect all issue ids and their values
  const issueIds = flatIssues.reduce((acc: issueId[], issue: ConfigIssue) => {
    if (issue.id !== undefined && issue.github !== undefined) {
      acc.push({
        id: issue.id,
        html_url: issue.github.html_url
      })
    }
    return acc
  }, [])

  // Update all issues whose description contains the id of another issue
  for (const issue of flatIssues) {
    if (issue.description !== undefined) {
      const updatedDescription = updateDescription(issue.description, issueIds)
      if (
        updatedDescription !== issue.description &&
        issue.github !== undefined
      ) {
        core.debug(
          `Will update description for issue ${issue.github.html_url}: ${updatedDescription}`
        )
        await octokit.graphql(
          `
            mutation($issueId: ID!, $body: String!) {
              updateIssue(input: {id: $issueId, body: $body}) {
                issue {
                  id
                  body
                }
              }
            }
          `,
          {
            issueId: issue.github.node_id,
            body: updatedDescription
          }
        )
        core.info(
          `Updated description for issue: ${issue.title} (url: ${issue.github.html_url})`
        )
      }
    }
  }
  return issues
}
