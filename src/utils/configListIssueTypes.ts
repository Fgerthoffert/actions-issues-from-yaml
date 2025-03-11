// This goes down the configuration tree and returns a list of repositories
export function configListIssueTypes(issues: ConfigIssue[]): ConfigIssueType[] {
  const issueTypes = issues.reduce(
    (acc: ConfigIssueType[], issue: ConfigIssue) => {
      if (issue.children) {
        acc = [...acc, ...configListIssueTypes(issue.children)]
      }
      if (issue.type === undefined) return acc
      if (
        acc.find(
          (m: ConfigIssueType) =>
            (m.name === issue.type && m.repository === issue.repository) ||
            issue.type === undefined
        )
      )
        return acc
      return [
        ...acc,
        { name: issue.type as string, repository: issue.repository }
      ]
    },
    []
  )
  return issueTypes
}
