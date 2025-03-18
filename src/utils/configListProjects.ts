import * as core from '@actions/core'

const getProjectsFromConfig = (issues: ConfigIssue[]): ConfigProject[] => {
  const projects = issues.reduce((acc: ConfigProject[], issue: ConfigIssue) => {
    if (
      issue.project !== undefined &&
      !acc.find(
        (a) => issue.project !== undefined && a.title === issue.project.title
      )
    )
      acc.push({
        title: issue.project.title,
        organization: issue.repository.split('/')[0]
      })
    if (issue.children) {
      const childrenProjects = getProjectsFromConfig(issue.children)
      for (const project of childrenProjects) {
        if (!acc.find((a) => a.title === project.title))
          acc.push({
            title: project.title,
            organization: issue.repository.split('/')[0]
          })
      }
    }
    return acc
  }, [])
  return projects
}

export const configListProjects = (issues: ConfigIssue[]): ConfigProject[] => {
  core.info(`Projects: Retrieving the list of projects from configuration`)
  const projects = getProjectsFromConfig(issues)
  core.info(
    `Projects: Unique projects found in configuration: ${projects.length}`
  )
  core.debug(`Projects: From config: ${JSON.stringify(projects)}`)
  return projects
}
