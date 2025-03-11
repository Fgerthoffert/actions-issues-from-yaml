import * as core from '@actions/core'

export function configListRepos(issues: ConfigIssue[]): string[] {
  const repos = issues.reduce((acc: string[], issue: ConfigIssue) => {
    if (issue.children) {
      acc = [...acc, ...configListRepos(issue.children)]
    }
    if (acc.includes(issue.repository)) return acc
    return [...acc, issue.repository]
  }, [])
  core.debug(`Unique repos found in configuration: ${repos.length}`)
  core.debug(JSON.stringify(repos))
  return repos
}
