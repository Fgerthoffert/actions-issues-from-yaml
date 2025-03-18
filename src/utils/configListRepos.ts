import * as core from '@actions/core'

const getReposFromConfig = (issues: ConfigIssue[]): string[] => {
  const repos = issues.reduce((acc: string[], issue: ConfigIssue) => {
    if (!acc.includes(issue.repository)) acc.push(issue.repository)
    if (issue.children) {
      const childrenRepos = getReposFromConfig(issue.children)
      for (const repo of childrenRepos) {
        if (!acc.includes(repo)) acc.push(repo)
      }
    }
    return acc
  }, [])
  return repos
}

export const configListRepos = (issues: ConfigIssue[]): string[] => {
  core.info(
    `Repositories: Retrieving the list of repositories from configuration`
  )
  const repos = getReposFromConfig(issues)
  core.info(
    `Repositories: Unique repos found in configuration: ${repos.length}`
  )
  core.debug(`Repositories: From config: ${JSON.stringify(repos)}`)
  return repos
}
