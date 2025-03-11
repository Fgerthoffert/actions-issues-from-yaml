// This goes down the configuration tree and returns a list of milestones
export function configListMilestones(issues: ConfigIssue[]): ConfigMilestone[] {
  const milestones = issues.reduce(
    (acc: ConfigMilestone[], issue: ConfigIssue) => {
      if (issue.children) {
        acc = [...acc, ...configListMilestones(issue.children)]
      }
      if (issue.milestone === undefined) return acc
      if (
        acc.find(
          (m: ConfigMilestone) =>
            m.title === issue.milestone && m.repository === issue.repository
        )
      )
        return acc
      return [
        ...acc,
        { title: issue.milestone as string, repository: issue.repository }
      ]
    },
    []
  )
  return milestones
}
