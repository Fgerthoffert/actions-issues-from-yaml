import * as core from '@actions/core'

// This goes down the configuration tree and returns a list of milestones
const getMilestonesFromConfig = (issues: ConfigIssue[]): ConfigMilestone[] => {
  const milestones = issues.reduce(
    (acc: ConfigMilestone[], issue: ConfigIssue) => {
      if (
        issue.milestone !== undefined &&
        !acc.find(
          (a) =>
            issue.milestone !== undefined &&
            a.title === issue.milestone &&
            a.repository === issue.repository
        )
      )
        acc.push({
          title: issue.milestone as string,
          repository: issue.repository
        })
      if (issue.children) {
        const childrenMilestones = getMilestonesFromConfig(issue.children)
        for (const milestone of childrenMilestones) {
          if (
            !acc.find(
              (a) =>
                a.title === milestone.title &&
                a.repository === milestone.repository
            )
          ) {
            acc.push({
              title: issue.milestone as string,
              repository: issue.repository
            })
          }
        }
      }
      return acc
    },
    []
  )
  return milestones
}

export const configListMilestones = (
  issues: ConfigIssue[]
): ConfigMilestone[] => {
  core.info(`Milestones: Retrieving the list of milestones from configuration`)
  const milestones = getMilestonesFromConfig(issues)
  core.info(
    `Milestones: Unique milestones found in configuration: ${milestones.length}`
  )
  core.debug(`Milestones: From config: ${JSON.stringify(milestones)}`)
  return milestones
}
