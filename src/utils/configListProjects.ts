// This goes down the configuration tree and returns a list of projects
export function configListProjects(issues: ConfigIssue[]): ConfigProject[] {
  const projects = issues.reduce((acc: ConfigProject[], issue: ConfigIssue) => {
    if (issue.children) {
      acc = [...acc, ...configListProjects(issue.children)]
    }
    if (issue.project === undefined) return acc
    // Only add if the project does not already exist
    if (
      acc.find(
        (p: ConfigProject) =>
          issue.project &&
          p.title === issue.project.title &&
          p.organization === issue.repository.split('/')[0]
      )
    )
      return acc
    return [
      ...acc,
      {
        title: issue.project.title,
        status: issue.project.status as string,
        organization: issue.repository.split('/')[0]
      }
    ]
  }, [])
  return projects
}
