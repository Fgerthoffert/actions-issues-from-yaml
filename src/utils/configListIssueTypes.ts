import * as core from '@actions/core'

// This goes down the configuration tree and returns a list of repositories
export function getIssueTypesFromConfig(
  issues: ConfigIssue[]
): ConfigIssueType[] {
  const issueTypes = issues.reduce(
    (acc: ConfigIssueType[], issue: ConfigIssue) => {
      if (
        issue.type !== undefined &&
        !acc.find(
          (a) =>
            issue.type !== undefined &&
            a.name === issue.type &&
            a.repository === issue.repository
        )
      )
        acc.push({
          name: issue.type as string,
          repository: issue.repository
        })

      if (issue.children) {
        const childrenTypes = getIssueTypesFromConfig(issue.children)
        for (const type of childrenTypes) {
          if (
            !acc.find(
              (a) =>
                issue.type !== undefined &&
                a.name === type.name &&
                a.repository === type.repository
            )
          ) {
            acc.push({
              name: type.name as string,
              repository: type.repository
            })
          }
        }
      }
      return acc
    },
    []
  )
  return issueTypes
}

export const configListIssueTypes = (
  issues: ConfigIssue[]
): ConfigIssueType[] => {
  core.info(
    `Issue types: Retrieving the list of issues types from configuration`
  )
  const issueTypes = getIssueTypesFromConfig(issues)
  core.info(
    `Issue types: Unique issue Types found in configuration: ${issueTypes.length}`
  )
  core.info(`Issue Types: From config: ${JSON.stringify(issueTypes)}`)
  return issueTypes
}
